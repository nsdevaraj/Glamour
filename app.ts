console.log("App.ts is running!");
document.addEventListener('DOMContentLoaded', () => {
    const header = document.createElement('h2');
    header.innerText = "Hello from app.ts";
    header.style.color = "blue";
    document.querySelector('.container')?.appendChild(header);
});
