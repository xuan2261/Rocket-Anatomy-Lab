import {
  initialState, selectPart, setExplode, setMode, toggleHidden, toggleIsolate,
  showAll, resetViewer, deriveView, partViewState
} from './core/engine.js'
import { demoManifest } from './core/demoManifest.js'
import { nasaSaturnVAssemblyManifest, nasaSaturnVAssemblySemanticManifest } from './core/assemblyManifest.js'
import { createTimelineController } from './timeline-controller.mjs'
import { createSectionController } from './section-controller.mjs'
import { createLearningController } from './learning-controller.mjs'
import { createAnatomyController } from './anatomy-controller.mjs'
import { entityDescription, entityLabel, onLanguageChange, t } from './i18n.mjs'

const canvas = document.querySelector('#viewport')
const ctx = canvas.getContext('2d')
const tree = document.querySelector('#tree')
const inspectorTitle = document.querySelector('#inspectorTitle')
const inspectorDescription = document.querySelector('#inspectorDescription')
const visibilityValue = document.querySelector('#visibilityValue')
const modeValue = document.querySelector('#modeValue')
const explodeValue = document.querySelector('#explodeValue')
const isolateBtn = document.querySelector('#isolateBtn')
const hideBtn = document.querySelector('#hideBtn')
const showAllBtn = document.querySelector('#showAllBtn')
const explodeSlider = document.querySelector('#explodeSlider')
const resetBtn = document.querySelector('#resetBtn')
const modeChip = document.querySelector('#modeChip')
const modeButtons = [...document.querySelectorAll('[data-mode]')]
const rawInventory = document.querySelector('#rawInventory')

let state = initialState()
let yaw = 0.58
let pitch = -0.12
let zoom = 1
let dragging = false
let lastPointer = null
let pointerStart = null
let hitPolygons = []

const palette = ['#dce8f6','#a7c7dd','#839eb8','#67819c','#465f79']
const timelineController = createTimelineController({
  assemblyIds: nasaSaturnVAssemblyManifest.segments.map(segment => segment.id),
  assemblyLabels: new Map(nasaSaturnVAssemblySemanticManifest.groups.map(group => [group.id, group.label])),
  disabled: true,
})
const sectionController = createSectionController({
  disabled: true,
  cappingSupported: false,
})
const learningController = createLearningController({
  disabled: true,
})
const anatomyController = createAnatomyController({
  disabled: true,
})

function resize() {
  const rect = canvas.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.max(1, Math.round(rect.width * dpr))
  canvas.height = Math.max(1, Math.round(rect.height * dpr))
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  draw()
}

const rotate = ([x,y,z]) => {
  const cy=Math.cos(yaw), sy=Math.sin(yaw), cx=Math.cos(pitch), sx=Math.sin(pitch)
  const x1=x*cy+z*sy, z1=-x*sy+z*cy
  return [x1, y*cx-z1*sx, y*sx+z1*cx]
}

function project(v) {
  const [x,y,z]=rotate(v)
  const camera=11.5
  const depth=Math.max(3, camera-z)
  const base=Math.min(canvas.clientWidth, canvas.clientHeight)*0.085*zoom
  const k=(camera/depth)*base
  return { x: canvas.clientWidth/2 + x*k, y: canvas.clientHeight/2 - y*k, z, depth }
}

function rgba(hex, a) {
  const n=parseInt(hex.slice(1),16)
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`
}

function partFaces(part, view, color) {
  const g=part.geometry, sides=24
  const y0=g.baseY + view.offset[1], y1=y0+g.height
  const ox=view.offset[0], oz=view.offset[2]
  const bottom=[], top=[]
  for(let i=0;i<sides;i++){
    const a=i/sides*Math.PI*2
    bottom.push([Math.cos(a)*g.radiusBottom+ox,y0,Math.sin(a)*g.radiusBottom+oz])
    top.push([Math.cos(a)*g.radiusTop+ox,y1,Math.sin(a)*g.radiusTop+oz])
  }
  const faces=[]
  for(let i=0;i<sides;i++){
    const j=(i+1)%sides
    faces.push([bottom[i],bottom[j],top[j],top[i]])
  }
  faces.push([...top])
  faces.push([...bottom].reverse())
  return faces.map(points=>{
    const p=points.map(project)
    return { partId:part.id, points:p, depth:p.reduce((s,q)=>s+q.z,0)/p.length, color, opacity:view.opacity, selected:view.selected }
  })
}

function drawGrid() {
  ctx.save()
  ctx.strokeStyle='rgba(160,190,220,.08)'
  ctx.lineWidth=1
  const y=canvas.clientHeight*.79
  for(let i=-7;i<=7;i++){
    const x=canvas.clientWidth/2+i*38
    ctx.beginPath();ctx.moveTo(x,y-18);ctx.lineTo(x,y+18);ctx.stroke()
  }
  ctx.beginPath();ctx.moveTo(canvas.clientWidth*.18,y);ctx.lineTo(canvas.clientWidth*.82,y);ctx.stroke()
  ctx.restore()
}

function draw() {
  ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight)
  drawGrid()
  const views=deriveView(demoManifest,state)
  const faces=[]
  demoManifest.parts.forEach((part,index)=>{
    const view=views[index]
    if(view.visible) faces.push(...partFaces(part,view,palette[index%palette.length]))
  })
  faces.sort((a,b)=>a.depth-b.depth)
  hitPolygons=[]
  for(const f of faces){
    ctx.beginPath()
    f.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y))
    ctx.closePath()
    ctx.fillStyle=rgba(f.color,f.opacity)
    ctx.fill()
    ctx.strokeStyle=f.selected?'rgba(247,200,106,.95)':'rgba(220,235,250,.20)'
    ctx.lineWidth=f.selected?2.4:0.7
    ctx.stroke()
    hitPolygons.push(f)
  }
}

function pointInPolygon(x,y,poly){
  let inside=false
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const xi=poly[i].x, yi=poly[i].y, xj=poly[j].x, yj=poly[j].y
    const hit=((yi>y)!=(yj>y)) && x < (xj-xi)*(y-yi)/(yj-yi || 1e-9)+xi
    if(hit) inside=!inside
  }
  return inside
}

function renderTree() {
  tree.replaceChildren()
  for(const part of demoManifest.parts){
    const row=document.createElement('div')
    row.className='tree-row'
    row.dataset.selected=String(state.selectedId===part.id)
    row.setAttribute('role','treeitem')
    row.setAttribute('aria-selected',String(state.selectedId===part.id))
    const toggleTarget=document.createElement('label')
    toggleTarget.className='tree-toggle-target'
    const check=document.createElement('input')
    check.type='checkbox'; check.checked=!state.hiddenIds.has(part.id)
    check.setAttribute('aria-label', t('tree.showPart', { label: entityLabel(part.id, part.label) }))
    check.addEventListener('change',()=>{state=toggleHidden(state,part.id);render()})
    toggleTarget.append(check)
    const btn=document.createElement('button')
    btn.type='button';btn.className='tree-select'
    const label=document.createElement('strong')
    label.textContent=entityLabel(part.id, part.label)
    const meta=document.createElement('span')
    meta.textContent=part.geometry.kind
    btn.append(label,meta)
    btn.addEventListener('click',()=>{state=selectPart(state,part.id);render()})
    row.append(toggleTarget,btn);tree.append(row)
  }
}

const modeLabel = mode => ({ normal: t('viewer.mode.normal'), ghost: t('viewer.mode.ghost'), xray: t('viewer.mode.xray') }[mode] ?? mode)

function renderInspector(){
  const part=demoManifest.parts.find(p=>p.id===state.selectedId) || null
  const view=part?partViewState(part,state):null
  inspectorTitle.textContent=part ? entityLabel(part.id, part.label) : t('inspector.noneTitle')
  inspectorDescription.textContent=part ? entityDescription(part.id, part.description) : t('inspector.noneDescription')
  visibilityValue.textContent=view ? t(view.visible ? 'inspector.visible' : 'inspector.hidden') : '—'
  modeValue.textContent=modeLabel(state.mode)
  explodeValue.textContent=`${Math.round(state.explode*100)}%`
  isolateBtn.disabled=!part;hideBtn.disabled=!part
  isolateBtn.textContent=t(part && state.isolatedId===part.id ? 'inspector.exitIsolate' : 'inspector.isolate')
  hideBtn.textContent=t(part && state.hiddenIds.has(part.id) ? 'inspector.show' : 'inspector.hide')
  modeChip.textContent=modeValue.textContent
  modeButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)))
}

function render(){renderTree();renderInspector();draw()}

modeButtons.forEach(btn=>btn.addEventListener('click',()=>{state=setMode(state,btn.dataset.mode);render()}))
explodeSlider.addEventListener('input',()=>{state=setExplode(state,Number(explodeSlider.value)/100);render()})
isolateBtn.addEventListener('click',()=>{if(state.selectedId){state=toggleIsolate(state,state.selectedId);render()}})
hideBtn.addEventListener('click',()=>{if(state.selectedId){state=toggleHidden(state,state.selectedId);render()}})
showAllBtn.addEventListener('click',()=>{state=showAll(state);render()})
resetBtn.addEventListener('click',()=>{state=resetViewer();yaw=.58;pitch=-.12;zoom=1;explodeSlider.value='0';render()})

canvas.addEventListener('pointerdown',e=>{dragging=true;pointerStart=[e.clientX,e.clientY];lastPointer=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId)})
canvas.addEventListener('pointermove',e=>{if(!dragging||!lastPointer)return;const dx=e.clientX-lastPointer[0],dy=e.clientY-lastPointer[1];if(Math.abs(dx)+Math.abs(dy)>1){yaw+=dx*.009;pitch=Math.max(-1.2,Math.min(1.2,pitch+dy*.007));lastPointer=[e.clientX,e.clientY];draw()}})
canvas.addEventListener('pointerup',e=>{const rect=canvas.getBoundingClientRect();const x=e.clientX-rect.left,y=e.clientY-rect.top;const moved=pointerStart?Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1]):0;dragging=false;lastPointer=null;pointerStart=null;if(moved<5){for(let i=hitPolygons.length-1;i>=0;i--){if(pointInPolygon(x,y,hitPolygons[i].points)){state=selectPart(state,hitPolygons[i].partId);render();break}}}})
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.65,Math.min(1.8,zoom*(e.deltaY>0?.94:1.06)));draw()},{passive:false})
canvas.addEventListener('keydown',e=>{if(e.key==='1'){state=setMode(state,'normal');render()}if(e.key==='2'){state=setMode(state,'ghost');render()}if(e.key==='3'){state=setMode(state,'xray');render()}if(e.key==='Escape'){state={...state,isolatedId:null};render()}})

new ResizeObserver(resize).observe(canvas)
if (rawInventory) {
  const note = document.createElement('p')
  note.textContent = t('raw.fallbackOnly')
  rawInventory.replaceChildren(note)
}
const unsubscribeLanguage = onLanguageChange(() => {
  if (rawInventory) {
    const note = document.createElement('p')
    note.textContent = t('raw.fallbackOnly')
    rawInventory.replaceChildren(note)
  }
  render()
})

render()

canvas.addEventListener('pointercancel',()=>{dragging=false;lastPointer=null;pointerStart=null})

window.addEventListener('pagehide', () => { timelineController.destroy(); sectionController.destroy(); learningController.destroy(); anatomyController.destroy(); unsubscribeLanguage() }, { once: true })
