const RentalBookingModule = (function() {
    const productIdElement = document.getElementById('rental_booking_productid');
    const productId = '7981409468583';
    const shopName = 'wapstoremuoihai.myshopify.com';
    let schemed_id = 0;
    let responseFromApi = '';
    let selectedOptions = [];

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
            schemed_id = responseFromApi.pricing_scheme.id;

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

        if (scheme.scheme_type === 'flatRate') {
            generateFlatRateOptions(scheme, optionsContainer);
        } else {
            // Handle other pricing schemes (tieredRate, dailyRate)
        }

        createBookingButton(optionsContainer);

        // Add date or time picker based on the time unit
        if (scheme.time_unit === 'day') {
            addDatePicker(optionsContainer);
        } else if (scheme.time_unit === 'hour') {
            addTimePicker(optionsContainer);
        }
    }

    function generateFlatRateOptions(scheme, optionsContainer) {
        const flatRatePeriod = scheme.flat_rate_period;
        const timeUnit = scheme.time_unit;
        const flatRate = parseFloat(scheme.flat_rate);

        const predefinedPeriods = [1, 2, 3].map(multiplier => flatRatePeriod * multiplier);

        predefinedPeriods.forEach(period => {
            const cost = flatRate * (period / flatRatePeriod);
            const schemeElement = document.createElement('div');
            schemeElement.classList.add('rental-option');
            schemeElement.style.padding = '10px 0';
            schemeElement.style.borderBottom = '1px solid #e6e6e6';
            schemeElement.innerHTML = `
                <label style="cursor: pointer;">
                    <input type="radio" name="rental_option" value="${period}" data-scheme="flatRate" data-cost="${cost}" style="margin-right: 10px;">
                    <strong>${period} ${timeUnit}${period > 1 ? 's' : ''}</strong> - Total cost: <span style="color: #2ecc71;">$${cost.toFixed(2)}</span>
                </label>
            `;
            optionsContainer.appendChild(schemeElement);
        });

        // Add custom block time option
        const customSchemeElement = document.createElement('div');
        customSchemeElement.classList.add('rental-option');
        customSchemeElement.style.padding = '10px 0';
        customSchemeElement.style.borderBottom = '1px solid #e6e6e6';
        customSchemeElement.innerHTML = `
            <label style="cursor: pointer;">
                <input type="radio" name="rental_option" value="custom" data-scheme="flatRate" data-cost="${flatRate}" style="margin-right: 10px;">
                Custom Block Time
            </label>
            <div id="customBlockTimeInput" style="display: none; margin-top: 10px; padding-left: 25px;">
                <input type="number" id="customBlockTimeValue" min="1" placeholder="Enter number of ${timeUnit}s" style="padding: 8px; width: 100px;">
                <span id="customCostDisplay" style="margin-left: 10px; color: #2ecc71;"></span>
            </div>
        `;
        optionsContainer.appendChild(customSchemeElement);

        // Event listener to show/hide custom block input
        document.querySelector('input[value="custom"]').addEventListener('change', function() {
            document.getElementById('customBlockTimeInput').style.display = 'block';
            updateCustomCostDisplay();
        });

        // Event listener to hide custom block input if other options are selected
        document.querySelectorAll('input[name="rental_option"]').forEach(input => {
            if (input.value !== 'custom') {
                input.addEventListener('change', function() {
                    document.getElementById('customBlockTimeInput').style.display = 'none';
                });
            }
        });

        // Update the custom cost display dynamically as the user inputs a value
        document.getElementById('customBlockTimeValue').addEventListener('input', updateCustomCostDisplay);
    }

    function updateCustomCostDisplay() {
        const customBlockTimeValue = document.getElementById('customBlockTimeValue').value;
        const flatRate = document.querySelector('input[value="custom"]').dataset.cost;
        if (customBlockTimeValue > 0) {
            const customTotalCost = (parseFloat(flatRate) * customBlockTimeValue).toFixed(2);
            document.getElementById('customCostDisplay').innerText = `Total cost: $${customTotalCost}`;
        } else {
            document.getElementById('customCostDisplay').innerText = '';
        }
    }

    function createBookingButton(optionsContainer) {
        let addButton = document.querySelector('[name="add"].product-form__submit');

        if (addButton) {
            addButton.style.display = 'none';
        } else {
            const productFormButtons = document.querySelector('.product-form__buttons');
            if (productFormButtons) {
                addButton = productFormButtons.querySelector('button');
                if (addButton) {
                    addButton.style.display = 'none';
                } else {
                    // Fallback to the button next to <input type="hidden" name="form_type" value="product">
                    const formTypeInput = document.querySelector('input[name="form_type"][value="product"]');
                    if (formTypeInput) {
                        addButton = formTypeInput.closest('form').querySelector('button');
                        if (addButton) {
                            addButton.style.display = 'none';
                        }
                    }
                }
            }
        }

        const paymentButtons = document.querySelectorAll('.shopify-payment-button__button');
        if (paymentButtons) {
            paymentButtons.forEach(button => {
                button.style.display = 'none';
            });
        }

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

        if (addButton) {
            addButton.parentNode.insertBefore(bookingButton, addButton);
        } else if (optionsContainer) {
            optionsContainer.appendChild(bookingButton);
        } else {
            console.error('No suitable container found to append the booking button.');
        }
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

    function handleBooking() {
        const selectedScheme = document.querySelector('input[name="rental_option"]:checked');
        if (!selectedScheme) {
            alert('Please select a rental option.');
            return;
        }

        let schemeId = selectedScheme.value;
        const schemeType = selectedScheme.dataset.scheme;
        let totalCost;

        if (schemeId === 'custom') {
            const customBlockTimeValue = document.getElementById('customBlockTimeValue').value;
            if (!customBlockTimeValue || customBlockTimeValue < 1) {
                alert(`Please enter a valid number of ${selectedScheme.dataset.unit}s.`);
                return;
            }
            schemeId = customBlockTimeValue;
            totalCost = parseFloat(selectedScheme.dataset.cost) * customBlockTimeValue;
        } else {
            totalCost = parseFloat(selectedScheme.dataset.cost);
        }

        // Collect start date or time
        const rentalStartDate = document.getElementById('rentalStartDate')?.value;
        const rentalStartTime = document.getElementById('rentalStartTime')?.value;

        createDraftOrder(schemeId, schemeType, totalCost, rentalStartDate, rentalStartTime);
    }

    async function createDraftOrder(schemed_id, schemeType, totalCost, rentalStartDate, rentalStartTime) {
        const variantIdElement = document.querySelector('input.product-variant-id[type="hidden"]');
        const productIdElement = document.querySelector('input.product-id[type="hidden"]');
        const variantValue = variantIdElement ? variantIdElement.value : null;
        const productIdValue = productIdElement ? productIdElement.value : null;

        const requestData = {
            shop_name: shopName,
            product_id: productIdValue,
            variant_id: variantValue,
            scheme_id: responseFromApi.pricing_scheme_id,
            scheme_type: schemeType,
            total_cost: totalCost,
            rental_start_date: rentalStartDate,
            rental_start_time: rentalStartTime,
            custom_properties: {
                'Product Type': 'Rental',
                'Scheme ID': responseFromApi.pricing_scheme_id,
                'Scheme Type': schemeType,
                'Total Cost': totalCost,
                'Rental Start Date': rentalStartDate,
                'Rental Start Time': rentalStartTime
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
        init: function() {
            fetchAndGenerateOptions().then(function() {
                // Initialization complete
            });
        }
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    RentalBookingModule.init();
});
RentalBookingModule.init();
