var find = require('array-find')
var merge = require('merge-flat-package-trees')
var semver = require('semver')

module.exports = function (
  tree, updatedPackageName, updatedPackageVersion, updatedPackageTree
) {
  // Insert the new dependency if required.
  var matched = false
  var directDependencyRange = false
  tree.forEach(function (dependency, dependencyIndex) {
    var isDirectDependency = (
      dependency.name === updatedPackageName &&
      dependency.range !== undefined &&
      semver.satisfies(updatedPackageVersion, dependency.range)
    )
    if (isDirectDependency) {
      matched = true
      directDependencyRange = dependency.range
      delete dependency.range
    }
    dependency.links.forEach(function (link, linkIndex) {
      var isLinkToUpdatedDependency = (
        link.name === updatedPackageName &&
        semver.satisfies(updatedPackageVersion, link.range)
      )
      if (isLinkToUpdatedDependency) {
        // Set a flag to merge the updated dependency's tree.
        matched = true
        // Splice in a link to the updated dependency.
        dependency.links.splice(linkIndex, 1, {
          name: updatedPackageName,
          version: updatedPackageVersion,
          // Keep the old link's range.
          range: link.range
        })
      }
    })
  })

  // If the updated package is linked into the tree, merge the updated
  // package's dependency tree.
  if (matched) {
    // If the updated package is a direct dependency in the tree, set
    // its range property before merging.
    if (directDependencyRange) {
      find(updatedPackageTree, function (element) {
        return (
          element.name === updatedPackageName &&
          element.version === updatedPackageVersion
        )
      })
      .range = directDependencyRange
    }
    merge(tree, updatedPackageTree)
  }

  // Prune orphaned dependencies.
  tree.forEach(function (dependency, index) {
    var required = (
      // Direct Dependency
      dependency.hasOwnProperty('range') ||
      // Indirect Dependency
      tree.some(function (otherDependency) {
        return otherDependency.links.some(function (link) {
          return (
            link.name === dependency.name &&
            link.version === dependency.version
          )
        })
      })
    )
    if (!required) {
      tree.splice(index, 1)
    }
  })
}
