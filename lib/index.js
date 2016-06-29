var formats = {
	"json5": 2,
	"json": 1,
}

formats = Object.keys(formats).sort(function(x, y) {
	return formats[y] - formats[x];
}).map(function(x) {
	return "package." + x;
})

// Overwriting fs.writeFile[Sync]
// Should be before read.
require("./write").formats = formats;

// Overwriting fs.readFile[Sync]
require("./read").formats = formats;

// Overwriting child_process.exec[Sync]
require("./exec").formats = formats;
