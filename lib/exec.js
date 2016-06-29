var childProcess = require("child_process")
  , fs = require("fs")
  , Path = require("path")

var orig_execFile = childProcess.execFile

childProcess.execFile = function(file, commandArgs) {
  if (
    file === "git" &&
    commandArgs.length > 1 &&
    commandArgs[0] === "add" &&
    Path.basename(commandArgs[1]) === "package.json"
  ) {
    var orig_args = arguments
    var args = Array.prototype.slice.apply(orig_args)

    return check_override(module.exports.formats.slice(0))

    function check_override(list) {
      var err
      var alt_file = list.shift()
      args[1][1] = Path.join(Path.dirname(commandArgs[1]), alt_file)

      try {
        fs.statSync(args[1][1], "utf8")
      } catch(err) {
        if (list.length) {
          return check_override(list)
        } else {
          alt_file = module.exports.formats[0]
          args[1][1] = Path.join(Path.dirname(commandArgs[1]), alt_file)

          /* fallthrough */
        }
      }

      // alt_file exists, so assuming that user works with this format
      return orig_execFile.apply(childProcess, args)
    }
  } else {
    return orig_execFile.apply(childProcess, arguments)
  }
}
