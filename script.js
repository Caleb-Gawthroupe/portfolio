document.addEventListener('DOMContentLoaded', () => {
    const sphere = document.querySelector('.visual-placeholder');

    // Add mouse move listener to the whole window or specific container
    document.addEventListener('mousemove', (e) => {
        if (!sphere) return;

        // Get the bounding rectangle of the sphere
        const rect = sphere.getBoundingClientRect();

        // Calculate the mouse position relative to the sphere's dimensions
        // e.clientX and e.clientY are relative to the viewport
        const xPos = e.clientX - rect.left;
        const yPos = e.clientY - rect.top;

        // Convert to percentages based on the sphere's width/height (400px)
        let xPercent = (xPos / rect.width) * 100;
        let yPercent = (yPos / rect.height) * 100;

        // Clamp the values to keep the "light" somewhat on the object
        // This prevents the highlight from completely disappearing if you move the mouse far away
        xPercent = Math.max(-50, Math.min(150, xPercent));
        yPercent = Math.max(-50, Math.min(150, yPercent));

        // Update the CSS variables for the gradient center
        sphere.style.setProperty('--mouse-x', `${xPercent}%`);
        sphere.style.setProperty('--mouse-y', `${yPercent}%`);
    });
});
