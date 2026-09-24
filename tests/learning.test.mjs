import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createLearningState,
  currentLearningLessonId,
  learningProgress,
  learningSearch,
  lessonIdFromSearch,
  nextLearningLesson,
  previousLearningLesson,
  selectLearningLesson,
  validateLearningLessonIds,
} from '../public/core/learning.js'
import {
  rocketLearningLessons,
  validateLearningManifest,
} from '../public/core/learningManifest.js'

const ids = rocketLearningLessons.map(lesson => lesson.id)

test('learning manifest has five unique semantic lessons and valid display presets', () => {
  assert.equal(rocketLearningLessons.length, 5)
  assert.deepEqual(validateLearningManifest(rocketLearningLessons), [])
  assert.deepEqual(validateLearningLessonIds(ids), [])
  assert.equal(new Set(rocketLearningLessons.map(lesson => lesson.assemblyId)).size, 5)
  for (const lesson of rocketLearningLessons) {
    assert.ok(lesson.sectionPreset.position >= 0 && lesson.sectionPreset.position <= 1)
    assert.ok(['x', 'y', 'z'].includes(lesson.sectionPreset.axis))
    assert.ok(['normal', 'ghost', 'xray'].includes(lesson.viewMode))
  }
})

test('learning navigation is bounded and deterministic', () => {
  let state = createLearningState(ids)
  assert.equal(currentLearningLessonId(state), ids[0])
  state = previousLearningLesson(state)
  assert.equal(currentLearningLessonId(state), ids[0])
  state = nextLearningLesson(state)
  assert.equal(currentLearningLessonId(state), ids[1])
  state = selectLearningLesson(state, ids.at(-1))
  assert.equal(currentLearningLessonId(state), ids.at(-1))
  state = nextLearningLesson(state)
  assert.equal(currentLearningLessonId(state), ids.at(-1))
  assert.deepEqual(learningProgress(state), { current: ids.length, total: ids.length })
})

test('unknown lesson ids fail closed', () => {
  assert.throws(() => createLearningState([]), /at least one lesson id/)
  assert.throws(() => createLearningState(['a', 'a']), /duplicate learning lesson id/)
  const state = createLearningState(ids)
  assert.throws(() => selectLearningLesson(state, 'unknown'), /unknown learning lesson id/)
  assert.throws(() => learningSearch('', 'unknown', ids, 'vi'), /unknown learning lesson id/)
})

test('deep links preserve unrelated query params and only accept known lesson ids', () => {
  assert.equal(lessonIdFromSearch('?lesson=base-assembly', ids), 'base-assembly')
  assert.equal(lessonIdFromSearch('?lesson=unknown', ids), null)
  assert.equal(lessonIdFromSearch('?foo=bar', ids), null)
  const search = learningSearch('?foo=bar', 'center-body-assembly', ids, 'en')
  const params = new URLSearchParams(search)
  assert.equal(params.get('foo'), 'bar')
  assert.equal(params.get('lesson'), 'center-body-assembly')
  assert.equal(params.get('lang'), 'en')
})
