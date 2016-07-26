var update = require('./')
var tape = require('tape')

tape('simple update', function (test) {
  // c@1.0.0
  // b@1.0.0
  // a -> b@^1.0.0 -> c@^1.0.0
  // c@1.0.1
  test.deepEqual(
    update(
      [
        {
          name: 'b',
          version: '1.0.0',
          range: '^1.0.0',
          links: [{name: 'c', version: '1.0.0', range: '^1.0.0'}]
        },
        {name: 'c', version: '1.0.0', links: []}
      ],
      'c', '1.0.1', [{name: 'c', version: '1.0.1', links: []}]
    ),
    [
      {
        name: 'b',
        version: '1.0.0',
        range: '^1.0.0',
        links: [{name: 'c', version: '1.0.1', range: '^1.0.0'}]
      },
      {name: 'c', version: '1.0.1', links: []}
    ]
  )
  test.end()
})

tape('complex update', function (test) {
  // c@1.0.0
  // b@1.0.0
  // d@1.0.0
  // a -> b@^1.0.0 -> c@^1.0.0
  //   -> d@^1.0.0 -> c@ 1.0.x
  // c@1.1.0
  test.deepEqual(
    update(
      [
        {
          name: 'b',
          version: '1.0.0',
          range: '^1.0.0',
          links: [{name: 'c', version: '1.0.0', range: '^1.0.0'}]
        },
        // Both b and d are satisfied by c@1.0.0
        {name: 'c', version: '1.0.0', links: []},
        {
          name: 'd',
          version: '1.0.0',
          range: '^1.0.0',
          links: [{name: 'c', version: '1.0.0', range: '1.0.x'}]
        }
      ],
      // c@1.1.0 satisfies b, but not d.
      'c', '1.1.0', [{name: 'c', version: '1.1.0', links: []}]
    ),
    [
      // b now links to c@1.1.0.
      {
        name: 'b',
        version: '1.0.0',
        range: '^1.0.0',
        links: [{name: 'c', version: '1.1.0', range: '^1.0.0'}]
      },
      // Both versions of c appear in the tree.
      {name: 'c', version: '1.0.0', links: []},
      {name: 'c', version: '1.1.0', links: []},
      // d still links to c@1.0.0.
      {
        name: 'd',
        version: '1.0.0',
        range: '^1.0.0',
        links: [{name: 'c', version: '1.0.0', range: '1.0.x'}]
      }
    ]
  )
  test.end()
})

tape('out-of-range noop', function (test) {
  // c@1.0.0
  // b@1.0.0
  // a -> b@^1.0.0 -> c@^1.0.0
  // c@2.0.0
  var tree = [
    {
      name: 'b',
      version: '1.0.0',
      range: '^1.0.0',
      links: [{name: 'c', version: '1.0.0', range: '^1.0.0'}]
    },
    {name: 'c', version: '1.0.0', links: []}
  ]
  test.deepEqual(
    update(
      tree,
      // c is a dependency, but 2.0.0 is out-of-range.
      'c', '2.0.0', [{name: 'c', version: '2.0.0', links: []}]
    ),
    tree // Returns the same tree without changes.
  )
  test.end()
})

tape('non-dependency noop', function (test) {
  // c@1.0.0
  // b@1.0.0
  // a -> b@^1.0.0 -> c@^1.0.0
  // x@1.0.0
  var tree = [
    {
      name: 'b',
      version: '1.0.0',
      range: '^1.0.0',
      links: [{name: 'c', version: '1.0.0', range: '^1.0.0'}]
    },
    {name: 'c', version: '1.0.0', links: []}
  ]
  test.deepEqual(
    update(
      tree,
      // x is not in a's dependency graph.
      'x', '1.0.0', [{name: 'x', version: '1.0.0', links: []}]
    ),
    tree // Returns the same tree without changes.
  )
  test.end()
})
