const express = require('express');
const userAuth = require('../middlewares/userAuth');
const { ResponseStatus } = require('../utils/constants');
const Util = require('../utils/util');
const ValidationError = require('../utils/ValidationError');

class API {
    static configRoute(root) {
        let router = new express.Router();
        return new PathBuilder(root, router);
    }
}

const MethodBuilder = class {
    constructor(root, subPath, router) {
        this.asGET = function(methodToExecute) {
            return new Builder('get', root, subPath, methodToExecute, router);
        };
        this.asPOST = function (methodToExecute) {
            return new Builder('post', root, subPath, methodToExecute, router);
        };
        this.asDELETE = function (methodToExecute) {
            return new Builder('delete', root, subPath, methodToExecute, router);
        };
        this.asUPDATE = function (methodToExecute) {
            return new Builder('patch', root, subPath, methodToExecute, router);
        }
    }
}

const PathBuilder = class {
    constructor(root, router) {
        this.addPath = function (subPath) {
            return new MethodBuilder(root, subPath, router);
        };
        this.getRouter = () => {
            return router;
        };
        this.changeRoot = (newRoot) => {
            root = newRoot;
            return this;
        }
    }
};

const Builder = class {
    constructor(
        methodType,
        root,
        subPath,
        executer,
        router,
        useAuthMiddleware,
        duplicateErrorHandler,
        middlewaresList = [],
        useUserAuth = false,
    ) {

        this.useUserAuth = () => {
            return new Builder(
                methodType,
                root,
                subPath,
                executer,
                router,
                useAuthMiddleware,
                duplicateErrorHandler,
                middlewaresList,
                true,
            );
        };
        
        this.userMiddlewares = (...middlewares) => {
            middlewaresList = [...middlewares];
            return new Builder(
                methodType,
                root,
                subPath,
                executer,
                router,
                useAuthMiddleware,
                duplicateErrorHandler,
                middlewaresList,
                useUserAuth,
            );
        };

        this.build = () => {
            let controller = async (req, res) => {
                try {
                    let response = await executer(req, res);
                    res.status(ResponseStatus.Success).send(response);
                } catch (e) {
                    console.log(e);
                    if (e && duplicateErrorHandler) {
                        res.status(ResponseStatus.InternalServerError).send(
                            Util.getErrorMessageFromString(duplicateErrorHandler(e))
                        );
                    } else {
                        console.log("e", e);
                        if (e && e.name != ValidationError.name) {
                            console.log(e);
                        }
                        res.status(ResponseStatus.BadRequest).send(Util.getErrorMessage(e));
                    }
                }
            };

            let middlewares = [...middlewaresList];
            if(useUserAuth) middlewares.push(userAuth);

            router[methodType](root + subPath, ...middlewares, controller);
            return new PathBuilder(root, router);
        };
    }
};

module.exports = API;
