var path = require('path'),
    gutil = require('gulp-util'),
    through = require('through2'),
    crypto = require('crypto'),
    fs = require('fs'),
    glob = require('glob');

(function() {
    function calcMd5(file, slice) {
        var md5 = crypto.createHash('md5');
        md5.update(file.contents, 'utf8');

        return slice > 0 ? md5.digest('hex').slice(0, slice) : md5.digest('hex');
    }

    module.exports = function(size, ifile, replaceBasename, flattenPath) {
        size = size || 0;

        return through.obj(function(file, enc, cb) {
            if (file.isStream()) {
                this.emit('error', new gutil.PluginError('gulp-debug', 'Streaming not supported'));
                return cb();
            }

            if (!file.contents) {
                return cb();
            }

            var d = calcMd5(file, size),
                filename = path.basename(file.path),
                relativepath = path.relative(file.base, file.path),
                dir;

            if (file.path[0] === '.') {
                dir = path.join(file.base, file.path);
            } else {
                dir = file.path;
            }
            dir = path.dirname(dir);

            var getReplacedName = function() {
                var dotPos = filename.lastIndexOf(".");
                return d + filename.substr(dotPos);
            };

            var getName = function() {
                return filename.split('.').map(function(item, i, arr) {
                    return i === arr.length - 2 ? item + '_' + d : item;
                }).join('.');
            };

            var md5_filename = replaceBasename ? getReplacedName() : getName();
            var searched_path = flattenPath ? relativepath.replace(/\\/g, '/') : filename;

            var overwriteFileInTpl = function(_ifile) {
                _ifile && glob(_ifile, function(err, files) {
                    if (err) {
                        return console.log(err);
                    }
                    files.forEach(function(ilist) {
                        var result = fs.readFileSync(ilist, 'utf8').replace(new RegExp(searched_path), md5_filename);
                        fs.writeFileSync(ilist, result, 'utf8');
                    });
                });
            };

            if (Object.prototype.toString.call(ifile) === "[object Array]") {
                ifile.forEach(overwriteFileInTpl);
            } else {
                overwriteFileInTpl(ifile);
            }

            file.path = path.join(dir, md5_filename);

            this.push(file);
            cb();
        }, function(cb) {
            cb();
        });
    };
})();
