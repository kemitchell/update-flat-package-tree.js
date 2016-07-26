var merge = require('merge-flat-package-trees')
var semver = require('semver')

module.exports = function (
  tree, updatedPackageName, updatedPackageVersion, newTree
) {
  // Insert the new dependency if required.
  var matched = false
  tree.forEach(function (dependency, dependencyIndex) {
    dependency.links.forEach(function (link, linkIndex) {
      var isLinkToNewDependency = (
        link.name === updatedPackageName &&
        semver.satisfies(updatedPackageVersion, link.range)
      )
      if (isLinkToNewDependency) {
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

  if (matched) {
    merge(tree, newTree)
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

  return tree
}
