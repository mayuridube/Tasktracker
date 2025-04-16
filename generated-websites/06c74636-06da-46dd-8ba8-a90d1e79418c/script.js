// Optional: Add some interactivity
// Example: Change the text on click (for demonstration purposes)

const helloText = document.getElementById('hello-text');

helloText.addEventListener('click', () => {
    helloText.textContent = 'Hello Universe!';
    setTimeout(() => {
        helloText.textContent = 'Hello World!';
    }, 2000);  // Reset after 2 seconds
});
