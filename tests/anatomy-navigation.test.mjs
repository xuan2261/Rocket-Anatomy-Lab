import test from 'node:test'
import assert from 'node:assert/strict'

import {
  anatomyCameraScale,
  anatomyNodeIdFromSearch,
  anatomySearch,
  filterAnatomyNodes,
  structureModeFromSearch,
} from '../public/core/anatomyNavigation.js'
import { saturnVAnatomyManifest } from '../public/core/anatomy.js'

const ids=saturnVAnatomyManifest.nodes.map(node=>node.id)

test('Phase 13 anatomy deep links preserve unrelated query state',()=>{
  assert.equal(anatomyNodeIdFromSearch('?anatomy=sic-lox-tank&lang=vi',ids),'sic-lox-tank')
  assert.equal(anatomyNodeIdFromSearch('?anatomy=missing',ids),null)
  assert.equal(structureModeFromSearch('?anatomy=sic-lox-tank',ids),'anatomy')
  assert.equal(structureModeFromSearch('?lesson=center-body-assembly',ids),'model')

  const search=anatomySearch('?lesson=center-body-assembly&theme=dark','sic-lox-tank',ids,'anatomy','vi')
  const params=new URLSearchParams(search)
  assert.equal(params.get('lesson'),'center-body-assembly')
  assert.equal(params.get('theme'),'dark')
  assert.equal(params.get('structure'),'anatomy')
  assert.equal(params.get('anatomy'),'sic-lox-tank')
  assert.equal(params.get('lang'),'vi')

  const modelSearch=anatomySearch(search,null,ids,'model','vi')
  const modelParams=new URLSearchParams(modelSearch)
  assert.equal(modelParams.has('structure'),false)
  assert.equal(modelParams.has('anatomy'),false)
  assert.equal(modelParams.get('lesson'),'center-body-assembly')
})

test('Phase 13 search is bilingual, diacritic-tolerant and deterministic',()=>{
  const vi=filterAnatomyNodes(saturnVAnatomyManifest,'bon lox','vi')
  assert.ok(vi.length >= 3)
  assert.ok(vi.every(node=>node.label.vi.includes('LOX')))

  const en=filterAnatomyNodes(saturnVAnatomyManifest,'command module','en')
  assert.equal(en[0]?.id,'apollo-command-module')

  const j2=filterAnatomyNodes(saturnVAnatomyManifest,'J-2','en')
  assert.ok(j2.some(node=>node.id==='sivb-j2-engine'))
  assert.ok(j2.some(node=>node.id==='sii-j2-engines'))
})

test('Phase 13 camera bookmarks stay conservative by anatomy level',()=>{
  const byId=id=>saturnVAnatomyManifest.nodes.find(node=>node.id===id)
  assert.ok(anatomyCameraScale(byId('saturn-v')) > anatomyCameraScale(byId('sic-stage')))
  assert.ok(anatomyCameraScale(byId('sic-stage')) > anatomyCameraScale(byId('sic-lox-tank')))
  assert.ok(anatomyCameraScale(byId('instrument-unit')) > anatomyCameraScale(byId('sic-lox-tank')))
})
