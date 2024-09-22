const RentalBookingModule = (function() {
    const productIdElement = document.getElementById('rental_booking_productid');
    const productId = '7981409468583';
    const shopName = 'wapstoremuoihai.myshopify.com';
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

        if (scheme.scheme_type === 'flatRate') {
            generateFlatRateOptions(scheme, optionsContainer);
        } else {
            // Handle other pricing schemes (tieredRate, dailyRate)
        }

        createBookingButton();
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
            schemeElement.innerHTML = `
                <label>
                    <input type="radio" name="rental_option" value="${period}" data-scheme="flatRate" data-cost="${cost}">
                    ${period} ${timeUnit}${period > 1 ? 's' : ''} - Total cost: $${cost.toFixed(2)}
                </label>
            `;
            optionsContainer.appendChild(schemeElement);
        });

        // Add custom block time option
        const customSchemeElement = document.createElement('div');
        customSchemeElement.classList.add('rental-option');
        customSchemeElement.innerHTML = `
            <label>
                <input type="radio" name="rental_option" value="custom" data-scheme="flatRate" data-cost="custom">
                Custom Block Time
            </label>
            <div id="customBlockTimeInput" style="display: none; margin-top: 10px;">
                <input type="number" id="customBlockTimeValue" min="1" placeholder="Enter number of ${timeUnit}s">
            </div>
        `;
        optionsContainer.appendChild(customSchemeElement);

        // Event listener to show/hide custom block input
        document.querySelector('input[value="custom"]').addEventListener('change', function() {
            document.getElementById('customBlockTimeInput').style.display = 'block';
        });

        // Event listener to hide custom block input if other options are selected
        document.querySelectorAll('input[name="rental_option"]').forEach(input => {
            if (input.value !== 'custom') {
                input.addEventListener('change', function() {
                    document.getElementById('customBlockTimeInput').style.display = 'none';
                });
            }
        });
    }

    function createBookingButton() {
        const addButton = document.querySelector('[name="add"].product-form__submit');
        if (addButton) {
            addButton.style.display = 'none';
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

        bookingButton.addEventListener('click', handleBooking);

        addButton.parentNode.insertBefore(bookingButton, addButton);
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

        createDraftOrder(schemeId, schemeType, totalCost);
    }

    async function createDraftOrder(schemeId, schemeType, totalCost) {
        const variantIdElement = document.querySelector('input.product-variant-id[type="hidden"]');
        const productIdElement = document.querySelector('input.product-id[type="hidden"]');
        const variantValue = variantIdElement ? variantIdElement.value : null;
        const productIdValue = productIdElement ? productIdElement.value : null;

        const requestData = {
            product_id: productIdValue,
            variant_id: variantValue,
            scheme_id: schemeId,
            scheme_type: schemeType,
            total_cost: totalCost,
            custom_properties: {
                'Product Type': 'Rental',
                'Scheme ID': schemeId,
                'Scheme Type': schemeType,
                'Total Cost': totalCost
            }
        };

        try {
            const response = await fetch('/api/create-draft-order', {
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
