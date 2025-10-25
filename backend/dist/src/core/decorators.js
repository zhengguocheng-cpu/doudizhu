"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Injectable = Injectable;
exports.Inject = Inject;
exports.Service = Service;
exports.AutoInject = AutoInject;
const container_1 = require("./container");
function Injectable(token) {
    return function (target) {
        const container = container_1.DependencyContainer.getInstance();
        const serviceToken = token || target;
        container.registerSingleton(serviceToken, () => new target());
        return target;
    };
}
function Inject(token) {
    return function (target, propertyKey, parameterIndex) {
        if (typeof parameterIndex === 'number') {
            const injectionKey = '__injections';
            if (!target[injectionKey]) {
                target[injectionKey] = [];
            }
            target[injectionKey][parameterIndex] = token;
        }
    };
}
function Service(token) {
    return function (target, propertyKey) {
        Object.defineProperty(target, propertyKey, {
            get: function () {
                return container_1.DependencyContainer.getInstance().resolve(token);
            },
            enumerable: true,
            configurable: true
        });
    };
}
function AutoInject(target) {
    const container = container_1.DependencyContainer.getInstance();
    return target;
}
//# sourceMappingURL=decorators.js.map