var fs = require("fs")
  , Path = require("path")

var orig_writeFile = fs.writeFile
  , orig_writeFileSync = fs.writeFileSync
  , orig_exists = fs.exists
  , orig_existsSync = fs.existsSync
  , orig_readFile = fs.readFile
  , orig_readFileSync = fs.readFileSync
  , orig_renameFile = fs.rename

// stringified json -> stringified json
function json2json(data) {
	var JSON5 = require("jju")
	return JSON5.stringify(JSON.parse(data.toString("utf8")))
}

function update(file, old_data, new_data) {
 if (file === "package.json5") {
		if (!old_data) {
			return json2json(new_data)
		} else {
			return require("jju").update(old_data, JSON.parse(new_data))
		}

	} else {
		if (!old_data) {
			return new_data
		} else {
			return require("jju").update(old_data, JSON.parse(new_data), {mode: "json"})
		}
	}
}

fs.rename = function(oldPath, newPath, cb) {
  if (
    Path.basename(newPath).indexOf("package.json") === 0 &&
    newPath.indexOf("/package/package.json") === -1 &&
    newPath.indexOf("/node_modules/") === -1
  ) {
    return cb();
  } else {
		orig_renameFile.apply(fs, arguments)
  }
}

fs.writeFile = function(path, data) {
	if (
    Path.basename(path).indexOf("package.json") === 0 &&
    path.indexOf("/package/package.json") === -1 &&
    path.indexOf("/node_modules/") === -1
  ) {
		var orig_args = arguments
		var args = Array.prototype.slice.apply(orig_args)

		check_override(module.exports.formats.slice(0))
	} else {
		orig_writeFile.apply(fs, arguments)
	}

	function check_override(list) {
		var alt_file = list.shift()
		args[0] = Path.join(Path.dirname(path), alt_file)
		orig_readFile(args[0], "utf8", function(err, olddata) {
			if (err) {
				// alt_file doesn't exist, looking for next one
				if (list.length) {
					return check_override(list)
				} else {
					alt_file = module.exports.formats[0]
					args[0] = Path.join(Path.dirname(path), alt_file)
					olddata = undefined

					/* fallthrough */
				}
			}

			// alt_file exists, so assuming that user works with this format
			data = update(alt_file, olddata, data)
			args[1] = data
			orig_writeFile.apply(fs, args)
		})
	}
}

fs.writeFileSync = function(path, data) {
	if (
    Path.basename(path).indexOf("package.json") === 0 &&
    path.indexOf("/package/package.json") === -1 &&
    path.indexOf("/node_modules/") === -1
  ) {
		var orig_args = arguments
		var args = Array.prototype.slice.apply(orig_args)

		return check_override(module.exports.formats.slice(0))

		function check_override(list) {
			var err
			var alt_file = list.shift()
			args[0] = Path.join(Path.dirname(path), alt_file)

			try {
				var olddata = orig_readFileSync(args[0], "utf8")
			} catch(err) {
				// alt_file doesn't exist, looking for next one
				if (list.length) {
					return check_override(list)
				} else {
					alt_file = module.exports.formats[0]
					args[0] = Path.join(Path.dirname(path), alt_file)
					olddata = undefined

					/* fallthrough */
				}
			}

			// alt_file exists, so assuming that user works with this format
			data = update(alt_file, olddata, data)
			args[1] = data
			return orig_writeFileSync.apply(fs, args)
		}
	} else {
		return orig_writeFileSync.apply(fs, arguments)
	}
}
