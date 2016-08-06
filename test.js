var sort = require('sort-flat-package-tree')
var tape = require('tape')
var update = require('./')

function doUpdate (a, name, version, b, result) {
  update(a, name, version, b)
  sort(a)
  this.deepEqual(a, result)
  this.end()
}

tape('simple update', function (test) {
  // c@1.0.0
  // b@1.0.0
  // a -> b@^1.0.0 -> c@^1.0.0
  // c@1.0.1
  doUpdate.apply(test, [
    [
      {
        name: 'b',
        version: '1.0.0',
        range: '^1.0.0',
        links: [{name: 'c', version: '1.0.0', range: '^1.0.0'}]
      },
      {name: 'c', version: '1.0.0', links: []}
    ],
    'c', '1.0.1',
    [{name: 'c', version: '1.0.1', links: []}],
    [
      {
        name: 'b',
        version: '1.0.0',
        range: '^1.0.0',
        links: [{name: 'c', version: '1.0.1', range: '^1.0.0'}]
      },
      {name: 'c', version: '1.0.1', links: []}
    ]
  ])
})

tape('direct-dependency update', function (test) {
  // b@1.0.0
  // a -> b@^1.0.0
  // b@1.0.1
  doUpdate.apply(test, [
    [{name: 'b', version: '1.0.0', range: '^1.0.0', links: []}],
    'b', '1.0.1',
    [{name: 'b', version: '1.0.1', links: []}],
    [{name: 'b', version: '1.0.1', range: '^1.0.0', links: []}]
  ])
})

tape('direct-versus-indirect dependency update', function (test) {
  // c@1.0.0
  // b@1.0.0
  // a -> b@^1.0.0 -> c@^1.0.0 -> b@1.0.x
  // b@1.1.0 -> c@^1.0.0
  doUpdate.apply(test, [
    [
      {
        name: 'b',
        version: '1.0.0',
        range: '^1.0.0',
        links: [{name: 'c', version: '1.0.0', range: '^1.0.0'}]
      },
      {
        name: 'c',
        version: '1.0.0',
        links: [{name: 'b', version: '1.0.0', range: '1.0.x'}]
      }
    ],
    'b', '1.1.0',
    [
      {
        name: 'b',
        version: '1.1.0',
        links: [{name: 'c', version: '1.0.0', range: '^1.0.0'}]
      },
      {name: 'c', version: '1.0.0', links: []}
    ],
    [
      // Old b remains.  It is no longer a direct dependency.
      {
        name: 'b',
        version: '1.0.0',
        links: [{name: 'c', version: '1.0.0', range: '^1.0.0'}]
      },
      // New b appears.  It is a direct dependency.
      {
        name: 'b',
        version: '1.1.0',
        range: '^1.0.0',
        links: [{name: 'c', version: '1.0.0', range: '^1.0.0'}]
      },
      // c remains.
      {
        name: 'c',
        version: '1.0.0',
        links: [{name: 'b', version: '1.0.0', range: '1.0.x'}]
      }
    ]
  ])
})

tape('complex update', function (test) {
  // c@1.0.0
  // b@1.0.0
  // d@1.0.0
  // a -> b@^1.0.0 -> c@^1.0.0
  //   -> d@^1.0.0 -> c@ 1.0.x
  // c@1.1.0
  doUpdate.apply(test, [
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
    'c', '1.1.0',
    [{name: 'c', version: '1.1.0', links: []}],
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
  ])
})

tape('out-of-range noop', function (test) {
  // c@1.0.0
  // b@1.0.0
  // a -> b@^1.0.0 -> c@^1.0.0
  // c@2.0.0
  doUpdate.apply(test, [
    [
      {
        name: 'b',
        version: '1.0.0',
        range: '^1.0.0',
        links: [{name: 'c', version: '1.0.0', range: '^1.0.0'}]
      },
      {name: 'c', version: '1.0.0', links: []}
    ],
    // c is a dependency, but 2.0.0 is out-of-range.
    'c', '2.0.0',
    [{name: 'c', version: '2.0.0', links: []}],
    // Produces the same tree without changes.
    [
      {
        name: 'b',
        version: '1.0.0',
        range: '^1.0.0',
        links: [{name: 'c', version: '1.0.0', range: '^1.0.0'}]
      },
      {name: 'c', version: '1.0.0', links: []}
    ]
  ])
})

tape('non-dependency noop', function (test) {
  // c@1.0.0
  // b@1.0.0
  // a -> b@^1.0.0 -> c@^1.0.0
  // x@1.0.0
  doUpdate.apply(test, [
    [
      {
        name: 'b',
        version: '1.0.0',
        range: '^1.0.0',
        links: [{name: 'c', version: '1.0.0', range: '^1.0.0'}]
      },
      {name: 'c', version: '1.0.0', links: []}
    ],
    // x is not in a's dependency graph.
    'x', '1.0.0',
    [{name: 'x', version: '1.0.0', links: []}],
    // Produces the same tree without changes.
    [
      {
        name: 'b',
        version: '1.0.0',
        range: '^1.0.0',
        links: [{name: 'c', version: '1.0.0', range: '^1.0.0'}]
      },
      {name: 'c', version: '1.0.0', links: []}
    ]
  ])
})

tape('URL dependency', function (test) {
  // b@1.0.0 -> c@URL
  // a -> b@^1.0.0 -> c@URL
  // b@1.0.1 -> c@URL
  doUpdate.apply(test, [
    [
      {
        name: 'b',
        version: '1.0.0',
        range: '^1.0.0',
        links: [{name: 'c', version: 'example/c', range: 'example/c'}]
      },
      {name: 'c', version: 'example/c', links: []}
    ],
    'b', '1.0.1',
    [
      {
        name: 'b',
        version: '1.0.1',
        links: [{name: 'c', version: 'example/c', range: 'example/c'}]
      },
      {name: 'c', version: 'example/c', links: []}
    ],
    [
      {
        name: 'b',
        version: '1.0.1',
        range: '^1.0.0',
        links: [{name: 'c', version: 'example/c', range: 'example/c'}]
      },
      {name: 'c', version: 'example/c', links: []}
    ]
  ])
})

tape('missing dependency resolved', function (test) {
  // a -> b@^1.0.0 (missing)
  // b@1.0.1
  doUpdate.apply(test, [
    [{name: 'b', range: '^1.0.0', links: []}],
    'b', '1.0.1',
    [{name: 'b', version: '1.0.1', links: []}],
    [{name: 'b', range: '^1.0.0', version: '1.0.1', links: []}]
  ])
})

tape('missing indirect dependency merged in', function (test) {
  // b@1.0.0
  // a -> b@^1.0.0
  // b@1.0.1 -> c@^1.0.0 (missing)
  doUpdate.apply(test, [
    [{name: 'b', range: '^1.0.0', version: '1.0.0', links: []}],
    'b', '1.0.1',
    [
      {
        name: 'b',
        version: '1.0.1',
        links: [{name: 'c', range: '^1.0.0', links: []}]
      }
    ],
    [
      {
        name: 'b',
        version: '1.0.1',
        range: '^1.0.0',
        links: [{name: 'c', range: '^1.0.0', links: []}]
      }
    ]
  ])
})

tape('missing indirect dependency merged out', function (test) {
  // b@1.0.0 -> c@^1.0.0 (missing)
  // a -> b@^1.0.0 -> c@^1.0.0 (missing)
  // c@1.0.0
  doUpdate.apply(test, [
    [
      {
        name: 'b',
        range: '^1.0.0',
        version: '1.0.0',
        links: [{name: 'c', range: '^1.0.0'}]
      }
    ],
    'c', '1.0.0',
    [{name: 'c', version: '1.0.0', links: []}],
    [
      {
        name: 'b',
        version: '1.0.0',
        range: '^1.0.0',
        links: [{name: 'c', version: '1.0.0', range: '^1.0.0'}]
      },
      {name: 'c', version: '1.0.0', links: []}
    ]
  ])
})

