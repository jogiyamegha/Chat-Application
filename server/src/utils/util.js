const moment = require('moment');
const fs = require('fs');

const Util = class {
    static isImageFile(fileOriginalName) {
        return fileOriginalName
        .toLocaleLowerCase()
        .match(/\.(jpg|jpeg|jpe|jif|jfif|jfi|png|bmp|webp|tiff|tif|dib|svg|svgz|heic|heif|csv|xlsx)$/) == undefined
            ? false
            : true;
    }
    static isAudioFile(fileOriginalName) {
        return fileOriginalName.toLocaleLowerCase().match(/\.(mp3|m4a)$/) == undefined ? false : true;
    }
    static isExcelFile(fileOriginalName) {
        return fileOriginalName.toLocaleLowerCase().match(/\.(xlsx|xls)$/) == undefined ? false : true;
    }
    static wrapWithRegexQry(textStr = "") {
        return new RegExp(Util.escapeRegex(textStr));
    }
    static getErrorMessage(mongooseException) {
        try {
            const mainJSONKeys = Object.keys(mongooseException.errors);
            if (mongooseException.errors[mainJSONKeys[0]].errors) {
                const jsonKeys = Object.keys(mongooseException.errors[mainJSONKeys[0]].errors);
                return {
                    error: mongooseException.errors[mainJSONKeys[0]].errors[jsonKeys[0]].properties.message,
                };
            } else {
                return {
                    error: mongooseException.errors[mainJSONKeys[0]].message,
                };
            }
        } catch (e) {
            return {
                error: mongooseException.message,
            };
        }
    }

    static getErrorMessageFromString(message) {
        return {
            error: message,
        };
    }
    static getBaseURL() {
        let baseURL = process.env.HOST;
        if (Util.useProductionSettings() == false) {
            baseURL += ":" + process.env.PORT;
        }
        return baseURL;
    }

    static useProductionSettings() {
        return Util.parseBoolean(process.env.isProd);
    }

    static parseBoolean(b) {
        return (b + '').toLowerCase() == 'true';
    }
     static generateRandomFileName(filename) {
        var ext = filename.split(".").pop();
        var random = Math.floor(Math.random() * 9000000000000000);
        let timestamp = new Date().getTime().toString();
        filename = timestamp + "_" + random + "." + ext;
        return filename;
    }
};

module.exports = Util;