const RentalBookingModule = (function () {
    const productIdElement = document.getElementsByName('product-id')[0];
    const productId = productIdElement.value;
    const shopName = 'wapstoremuoihai.myshopify.com';
    let responseFromApi = '';

    async function fetchAndGenerateOptions() {
        if (!responseFromApi) {
            await sendProductInfo(productId, shopName);
            generateRentalOptions(responseFromApi);
        }
    }

    async function sendProductInfo(product_id, shop_name) {
        const url = 'https://colab.ngrok.app/api/product-info'; // Replace with your actual API endpoint
        const data = {
            product_id: product_id,
            shop_name: shop_name
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            responseFromApi = await response.json();
            return responseFromApi;
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function generateRentalOptions(productData) {
        let optionsContainer = document.getElementById('rentalOptionsContainer');

        if (!optionsContainer) {
            optionsContainer = document.querySelector('.product-form__buttons');
        }

        if (!optionsContainer) {
            console.error('No suitable container found to append rental options.');
            return;
        }

        const scheme = productData.pricing_scheme;

        // Clear previous options if any
        optionsContainer.innerHTML = '';

        if (scheme.scheme_type === 'tieredRate') {
            generateTieredRateOptions(scheme, optionsContainer);
        }

        // Add date or time picker based on the time unit
        if (scheme.time_unit === 'day') {
            addDatePicker(optionsContainer);
        } else if (scheme.time_unit === 'hour') {
            addTimePicker(optionsContainer);
        }

        createBookingButton(optionsContainer);
    }

    function generateTieredRateOptions(scheme, optionsContainer) {
        const initialPeriod = scheme.initial_period;
        const initialRate = parseFloat(scheme.initial_rate);
        const subsequentRate = parseFloat(scheme.subsequent_rate);
        const timeUnit = scheme.time_unit;

        // Explanation of pricing calculation
        const pricingExplanation = document.createElement('div');
        pricingExplanation.style.marginBottom = '10px';
        pricingExplanation.style.color = '#555';
        pricingExplanation.innerHTML = `
            <p><strong>Pricing Explanation:</strong></p>
            <p>The base rate for the first ${initialPeriod} ${timeUnit}${initialPeriod > 1 ? 's' : ''} is $${initialRate.toFixed(2)}.</p>
            <p>Each additional ${timeUnit} beyond the first ${initialPeriod} ${timeUnit}${initialPeriod > 1 ? 's' : ''} is charged at $${subsequentRate.toFixed(2)} per ${timeUnit}.</p>
        `;
        optionsContainer.appendChild(pricingExplanation);

        // Predefined durations
        const predefinedDurations = [initialPeriod, initialPeriod + 1, initialPeriod + 2, initialPeriod + 3];

        predefinedDurations.forEach((duration) => {
            const additionalHours = duration - initialPeriod;
            const additionalPrice = additionalHours > 0 ? subsequentRate * additionalHours : 0;
            const totalPrice = initialRate + additionalPrice;

            const schemeElement = document.createElement('div');
            schemeElement.classList.add('rental-option');
            schemeElement.style.padding = '10px 0';
            schemeElement.style.borderBottom = '1px solid #e6e6e6';
            schemeElement.innerHTML = `
                <label style="cursor: pointer;">
                    <input type="radio" name="rental_option" value="${duration}" data-scheme="tieredRate" data-price="${totalPrice}" style="margin-right: 10px;">
                    <strong>${duration} ${timeUnit}${duration > 1 ? 's' : ''}</strong> - $${initialRate.toFixed(2)} ${additionalPrice > 0 ? `+ $${additionalPrice.toFixed(2)} for ${additionalHours} additional ${timeUnit}${additionalHours > 1 ? 's' : ''}` : ''} = <span style="color: #2ecc71;">$${totalPrice.toFixed(2)}</span>
                </label>
            `;
            optionsContainer.appendChild(schemeElement);
        });

        // Add custom hours option
        const customSchemeElement = document.createElement('div');
        customSchemeElement.classList.add('rental-option');
        customSchemeElement.style.padding = '10px 0';
        customSchemeElement.style.borderBottom = '1px solid #e6e6e6';
        customSchemeElement.innerHTML = `
            <label style="cursor: pointer;">
                <input type="radio" name="rental_option" value="custom" data-scheme="tieredRate" data-price="${initialRate}" data-initial-period="${initialPeriod}" data-subsequent-rate="${subsequentRate}" style="margin-right: 10px;">
                Custom ${timeUnit}${timeUnit > 1 ? 's' : ''}
            </label>
            <div id="customBlockTimeInput" style="display: none; margin-top: 10px; padding-left: 25px;">
                <input type="number" id="customBlockTimeValue" min="${initialPeriod}" placeholder="Enter number of ${timeUnit}s" style="padding: 8px; width: 100px;">
                <span id="customCostDisplay" style="margin-left: 10px; color: #2ecc71;"></span>
            </div>
            <p id="customExplanation" style="display: none; color: #555; margin-top: 10px;"></p>
        `;
        optionsContainer.appendChild(customSchemeElement);

        // Event listener to show/hide custom block input
        document.querySelector('input[value="custom"]').addEventListener('change', function () {
            document.getElementById('customBlockTimeInput').style.display = 'block';
            document.getElementById('customExplanation').style.display = 'block';
            updateCustomCostDisplay();
        });

        // Event listener to hide custom block input if other options are selected
        document.querySelectorAll('input[name="rental_option"]').forEach((input) => {
            if (input.value !== 'custom') {
                input.addEventListener('change', function () {
                    document.getElementById('customBlockTimeInput').style.display = 'none';
                    document.getElementById('customExplanation').style.display = 'none';
                });
            }
        });

        // Update the custom cost display dynamically as the user inputs a value
        document.getElementById('customBlockTimeValue').addEventListener('input', updateCustomCostDisplay);
    }

    function updateCustomCostDisplay() {
        const customBlockTimeValue = document.getElementById('customBlockTimeValue').value;
        const initialRate = parseFloat(document.querySelector('input[value="custom"]').dataset.price);
        const initialPeriod = parseInt(document.querySelector('input[value="custom"]').dataset.initialPeriod, 10);
        const subsequentRate = parseFloat(document.querySelector('input[value="custom"]').dataset.subsequentRate);

        let customTotalPrice = 0;
        let explanationText = '';

        if (customBlockTimeValue > initialPeriod) {
            customTotalPrice = initialRate + subsequentRate * (customBlockTimeValue - initialPeriod);
            explanationText = `You selected ${customBlockTimeValue} hours. Base rate: $${initialRate.toFixed(2)} for the first ${initialPeriod} hour${initialPeriod > 1 ? 's' : ''}, plus $${subsequentRate.toFixed(2)} for each additional hour. Total price: $${customTotalPrice.toFixed(2)}.`;
        } else {
            customTotalPrice = initialRate;
            explanationText = `You selected ${customBlockTimeValue} hours. Base rate: $${initialRate.toFixed(2)} for up to ${initialPeriod} hour${initialPeriod > 1 ? 's' : ''}. Total price: $${customTotalPrice.toFixed(2)}.`;
        }

        document.getElementById('customCostDisplay').innerText = `Total price: $${customTotalPrice.toFixed(2)}`;
        document.getElementById('customExplanation').innerText = explanationText;
    }

    function addDatePicker(optionsContainer) {
        const datePickerContainer = document.createElement('div');
        datePickerContainer.style.marginTop = '15px';
        datePickerContainer.innerHTML = `
            <label for="rentalStartDate">Select Start Date:</label>
            <input type="date" id="rentalStartDate" name="rental_start_date" style="padding: 8px; width: 100%;">
        `;
        optionsContainer.appendChild(datePickerContainer);
    }

    function addTimePicker(optionsContainer) {
        const timePickerContainer = document.createElement('div');
        timePickerContainer.style.marginTop = '15px';
        timePickerContainer.innerHTML = `
            <label for="rentalStartTime">Select Start Time:</label>
            <input type="time" id="rentalStartTime" name="rental_start_time" style="padding: 8px; width: 100%;">
        `;
        optionsContainer.appendChild(timePickerContainer);
    }

    function createBookingButton(optionsContainer) {
        const bookingButton = document.createElement('div');
        bookingButton.innerText = 'Book Now';
        bookingButton.id = 'rentalBookingButton';
        bookingButton.classList.add('button--full-width', 'primary', 'button');
        bookingButton.style.marginTop = '20px';
        bookingButton.style.backgroundColor = '#2ecc71';
        bookingButton.style.color = '#fff';
        bookingButton.style.padding = '12px';
        bookingButton.style.fontSize = '16px';
        bookingButton.style.textAlign = 'center';
        bookingButton.style.cursor = 'pointer';
        bookingButton.style.borderRadius = '5px';
        bookingButton.style.transition = 'background-color 0.3s ease';

        bookingButton.addEventListener('mouseenter', () => {
            bookingButton.style.backgroundColor = '#27ae60';
        });
        bookingButton.addEventListener('mouseleave', () => {
            bookingButton.style.backgroundColor = '#2ecc71';
        });

        bookingButton.addEventListener('click', handleBooking);

        optionsContainer.appendChild(bookingButton);
    }

    function handleBooking() {
        const selectedScheme = document.querySelector('input[name="rental_option"]:checked');
        if (!selectedScheme) {
            alert('Please select a rental option.');
            return;
        }

        let schemeId = selectedScheme.value;
        const schemeType = selectedScheme.dataset.scheme;
        let totalPrice;
        let numberOfBlocks;

        if (schemeId === 'custom') {
            const customBlockTimeValue = document.getElementById('customBlockTimeValue').value;
            if (!customBlockTimeValue || customBlockTimeValue < 1) {
                alert(`Please enter a valid number of ${selectedScheme.dataset.unit}s.`);
                return;
            }
            schemeId = customBlockTimeValue;
            totalPrice = parseFloat(selectedScheme.dataset.price) + (parseFloat(selectedScheme.dataset.subsequentRate) * (customBlockTimeValue - selectedScheme.dataset.initialPeriod));
            numberOfBlocks = customBlockTimeValue;
        } else {
            totalPrice = parseFloat(selectedScheme.dataset.price);
            numberOfBlocks = schemeId;
        }

        // Collect start date or time
        const rentalStartDate = document.getElementById('rentalStartDate')?.value;
        const rentalStartTime = document.getElementById('rentalStartTime')?.value;

        createDraftOrder(schemeId, schemeType, totalPrice, rentalStartDate, rentalStartTime, numberOfBlocks);
    }

    async function createDraftOrder(schemeId, schemeType, totalPrice, rentalStartDate, rentalStartTime, numberOfBlocks) {
        const variantIdElement = document.querySelector('input.product-variant-id[type="hidden"]');
        const productIdElement = document.querySelector('input.product-id[type="hidden"]');
        const variantValue = variantIdElement ? variantIdElement.value : null;
        const productIdValue = productIdElement ? productIdElement.value : null;

        const requestData = {
            shop_name: shopName,
            product_id: productIdValue,
            variant_id: variantValue,
            scheme_id: schemeId,
            scheme_type: schemeType,
            total_price: totalPrice,
            rental_start_date: rentalStartDate,
            rental_start_time: rentalStartTime,
            number_of_blocks: numberOfBlocks,
            custom_properties: {
                'Product Type': 'Rental',
                'Scheme ID': schemeId,
                'Scheme Type': schemeType,
                'Total Price': totalPrice,
                'Rental Start Date': rentalStartDate,
                'Rental Start Time': rentalStartTime,
                'Number of Blocks': numberOfBlocks
            }
        };

        try {
            const response = await fetch('https://colab.ngrok.app/api/create-draft-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error('Failed to create draft order.');
            }

            const data = await response.json();
            if (data.redirectUrl) {
                window.location.href = data.redirectUrl;
            }
        } catch (error) {
            console.error('Error creating draft order:', error);
        }
    }

    return {
        init: function () {
            fetchAndGenerateOptions().then(function () {
                // Initialization complete
            });
        }
    };
})();

document.addEventListener('DOMContentLoaded', function () {
    RentalBookingModule.init();
});
RentalBookingModule.init();
