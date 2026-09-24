import test from 'node:test'
import assert from 'node:assert/strict'

import {
  detailInspectorSearch,
  detailInspectorStateFromSearch,
} from '../public/core/anatomyNavigation.js'

const parts=['stage1-top-a','stage1-top-b','stage1-bottom-a','stage1-bottom-b']

test('Phase 17 detail inspector URL state round-trips selection, explode and visibility',()=>{
  const search=detailInspectorSearch('?structure=anatomy&anatomy=sic-stage',{
    partId:'stage1-top-a',
    explode:0.55,
    hiddenPartIds:['stage1-bottom-b'],
    ghostOthers:true,
    onlyPart:false,
  })
  const parsed=detailInspectorStateFromSearch(search,parts)
  assert.deepEqual(parsed,{
    partId:'stage1-top-a',
    explode:0.55,
    hiddenPartIds:['stage1-bottom-b'],
    ghostOthers:true,
    onlyPart:false,
  })

  const params=new URLSearchParams(search)
  assert.equal(params.get('structure'),'anatomy')
  assert.equal(params.get('anatomy'),'sic-stage')
  assert.equal(params.get('detailPart'),'stage1-top-a')
  assert.equal(params.get('detailExplode'),'55')
  assert.equal(params.get('detailHidden'),'stage1-bottom-b')
  assert.equal(params.get('detailGhost'),'1')
  assert.equal(params.has('detailOnly'),false)
})

test('Phase 17 detail inspector filters invalid URL part ids and clamps explode',()=>{
  const parsed=detailInspectorStateFromSearch(
    '?detailPart=unknown&detailExplode=145&detailHidden=stage1-top-b,unknown&detailGhost=1&detailOnly=1',
    parts,
  )
  assert.equal(parsed.partId,null)
  assert.equal(parsed.explode,1)
  assert.deepEqual(parsed.hiddenPartIds,['stage1-top-b'])
  assert.equal(parsed.ghostOthers,false)
  assert.equal(parsed.onlyPart,false)
})
