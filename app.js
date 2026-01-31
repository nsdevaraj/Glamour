"use strict";
console.log("App.ts is running!");
document.addEventListener('DOMContentLoaded', () => {
    var _a;
    const header = document.createElement('h2');
    header.innerText = "Hello from app.ts";
    header.style.color = "blue";
    (_a = document.querySelector('.container')) === null || _a === void 0 ? void 0 : _a.appendChild(header);
});
