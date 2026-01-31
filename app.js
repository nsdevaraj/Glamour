"use strict";
// app.ts
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.container');
    if (container) {
        container.style.opacity = '0';
        container.style.transition = 'opacity 1s ease-in-out';
        // Trigger reflow
        void container.offsetWidth;
        container.style.opacity = '1';
    }
    console.log("App.ts loaded: Fade-in animation applied.");
});
