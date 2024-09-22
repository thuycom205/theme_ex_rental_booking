async function handleConfirmBooking(roomId, selectedRoomTitle, cineScheduleId) {
    const fullScreenModal = document.createElement('div');
    fullScreenModal.className = 'full-screen-modal';
    document.body.appendChild(fullScreenModal);

    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading-spinner';
    loadingSpinner.textContent = 'Loading seat map...';
    fullScreenModal.appendChild(loadingSpinner);

    // Create and add the Close button
    const closeButton = document.createElement('span');
    closeButton.className = 'close-fullscreen-modal';
    closeButton.textContent = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '20px';
    closeButton.style.fontSize = '30px';
    closeButton.style.cursor = 'pointer';
    fullScreenModal.appendChild(closeButton);

    // Attach event listener to close the modal
    closeButton.addEventListener('click', function () {
        document.body.removeChild(fullScreenModal);
    });

    try {
        const response = await fetch(`http://localhost:8021/api/seat_map_info/${roomId}/${cineScheduleId}`);
        if (!response.ok) throw new Error('Failed to load seat map');

        const data = await response.json();
        loadingSpinner.remove();

        normalizeSeatCoordinates(data.seat_map);

        // Render seat map
        renderSeatMap(data.seat_map, fullScreenModal);

        // Start the countdown timer
        startCountdown(10, fullScreenModal);

        // Add Checkout button
        const checkoutButton = document.createElement('button');
        checkoutButton.className = 'checkout-button';
        checkoutButton.textContent = 'Checkout';
        checkoutButton.addEventListener('click', function () {
            handleCheckout(checkoutButton);
        });
        fullScreenModal.appendChild(checkoutButton);
    } catch (error) {
        console.error(error);
    }
}
