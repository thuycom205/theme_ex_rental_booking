const RentalBookingModule = (function () {
    // const productIdElement = document.getElementById('rental_booking_productid');
    const productIdElements = document.getElementsByName('product-id');
    const productIdElement = productIdElements.length > 0 ? productIdElements[0] : null;
    const productId = productIdElement ? productIdElement.value : null;

    // const productId = '7981409468583';
    const shopName =Shopify.shop;
    let schemeId = 0;

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
            schemeId = responseFromApi.pricing_scheme.id;

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
        }
        if (scheme.scheme_type === 'tieredRate') {
            generateTieredRateOptions(scheme, optionsContainer);
        }// Handle other pricing schemes (tieredRate, dailyRate)

        if (scheme.scheme_type === 'dailyRate') {
            generateDailyRateOptions(scheme, optionsContainer);
        }

        // Add date or time picker based on the time unit


        if (scheme.scheme_type === 'flatRate' || scheme.scheme_type === 'tieredRate') {
            if (scheme.time_unit === 'day') {
                addDatePicker(optionsContainer);
            } else if (scheme.time_unit === 'hour') {
                addTimePicker(optionsContainer);
            }
        } else if (scheme.scheme_type === 'dailyRate') {
            addDatePicker(optionsContainer);
            addTimePicker(optionsContainer);
        }

        createBookingButton(optionsContainer);
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
        document.querySelector('input[value="custom"]').addEventListener('change', function () {
            document.getElementById('customBlockTimeInput').style.display = 'block';
            updateCustomCostDisplay();
        });

        // Event listener to hide custom block input if other options are selected
        document.querySelectorAll('input[name="rental_option"]').forEach(input => {
            if (input.value !== 'custom') {
                input.addEventListener('change', function () {
                    document.getElementById('customBlockTimeInput').style.display = 'none';
                });
            }
        });

        // Update the custom cost display dynamically as the user inputs a value
        document.getElementById('customBlockTimeValue').addEventListener('input', updateCustomCostDisplay);
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
    function generateDailyRateOptions(scheme, optionsContainer) {
        const dailyRate = parseFloat(scheme.daily_rate);
        const hourlyOverageRate = parseFloat(scheme.hourly_overage_rate);

        // Explanation of pricing calculation
        const pricingExplanation = document.createElement('div');
        pricingExplanation.style.marginBottom = '10px';
        pricingExplanation.style.color = '#555';
        pricingExplanation.innerHTML = `
            <p><strong>Pricing Explanation:</strong></p>
            <p>The daily rate is $${dailyRate.toFixed(2)}.</p>
            <p>Each additional hour beyond a full day is charged at $${hourlyOverageRate.toFixed(2)} per hour.</p>
        `;
        optionsContainer.appendChild(pricingExplanation);

        // Full day only option
        const fullDayOnlyOption = document.createElement('div');
        fullDayOnlyOption.classList.add('rental-option');
        fullDayOnlyOption.style.padding = '10px 0';
        fullDayOnlyOption.style.borderBottom = '1px solid #e6e6e6';
        fullDayOnlyOption.innerHTML = `
            <label style="cursor: pointer;">
                <input type="radio" name="rental_option" value="fullday" data-scheme="dailyRate" data-daily-rate="${dailyRate}" style="margin-right: 10px;">
                Full Day Only - $${dailyRate.toFixed(2)} per day
            </label>
            <div id="dayBlockInput" style="display: none; margin-top: 10px; padding-left: 25px;">
                <input type="number" id="dayBlockValue" min="1" placeholder="Enter number of days" style="padding: 8px; width: 100px;">
                <span id="dayCostDisplay" style="margin-left: 10px; color: #2ecc71;"></span>
            </div>
        `;
        optionsContainer.appendChild(fullDayOnlyOption);

        // Full day + extra hours option
        const fullDayWithHoursOption = document.createElement('div');
        fullDayWithHoursOption.classList.add('rental-option');
        fullDayWithHoursOption.style.padding = '10px 0';
        fullDayWithHoursOption.style.borderBottom = '1px solid #e6e6e6';
        fullDayWithHoursOption.innerHTML = `
            <label style="cursor: pointer;">
                <input type="radio" name="rental_option" value="full_day_with_hours" data-scheme="dailyRate" data-daily-rate="${dailyRate}" data-hourly-overage-rate="${hourlyOverageRate}" style="margin-right: 10px;">
                Full Day + Extra Hours
            </label>
            <div id="dayHourBlockInput" style="display: none; margin-top: 10px; padding-left: 25px;">
                <input type="number" id="dayHourBlockValueDays" min="1" placeholder="Enter number of days" style="padding: 8px; width: 100px;">
                <input type="number" id="dayHourBlockValueHours" min="0" placeholder="Enter number of extra hours" style="padding: 8px; width: 100px; margin-top: 10px;">
                <span id="dayHourCostDisplay" style="margin-left: 10px; color: #2ecc71;"></span>
            </div>
        `;
        optionsContainer.appendChild(fullDayWithHoursOption);

        // Event listener to show/hide block inputs
        document.querySelector('input[value="fullday"]').addEventListener('change', function () {
            document.getElementById('dayBlockInput').style.display = 'block';
            document.getElementById('dayHourBlockInput').style.display = 'none';
            updateDayCostDisplayForDailyRate();
        });

        document.querySelector('input[value="full_day_with_hours"]').addEventListener('change', function () {
            document.getElementById('dayBlockInput').style.display = 'none';
            document.getElementById('dayHourBlockInput').style.display = 'block';
            updateDayHourCostDisplayForDailyRate();
        });

        // Update the cost display dynamically as the user inputs a value
        document.getElementById('dayBlockValue').addEventListener('input', updateDayCostDisplayForDailyRate);
        document.getElementById('dayHourBlockValueDays').addEventListener('input', updateDayHourCostDisplayForDailyRate);
        document.getElementById('dayHourBlockValueHours').addEventListener('input', updateDayHourCostDisplayForDailyRate);
    }

    function updateDayCostDisplayForDailyRate() {
        const dayBlockValue = document.getElementById('dayBlockValue').value;
        const dailyRate = parseFloat(document.querySelector('input[value="fullday"]').dataset.dailyRate);

        if (dayBlockValue > 0) {
            const totalCost = (dailyRate * dayBlockValue).toFixed(2);
            document.getElementById('dayCostDisplay').innerText = `Total price: $${totalCost}`;
        } else {
            document.getElementById('dayCostDisplay').innerText = '';
        }
    }

    function updateDayHourCostDisplayForDailyRate() {
        const dayValue = document.getElementById('dayHourBlockValueDays').value;
        const hourValue = document.getElementById('dayHourBlockValueHours').value;
        const dailyRate = parseFloat(document.querySelector('input[value="full_day_with_hours"]').dataset.dailyRate);
        const hourlyOverageRate = parseFloat(document.querySelector('input[value="full_day_with_hours"]').dataset.hourlyOverageRate);

        let totalCost = 0;
        let explanationText = '';

        if (dayValue > 0 || hourValue >= 0) {
            totalCost = (dailyRate * dayValue) + (hourlyOverageRate * hourValue);
            explanationText = `You selected ${dayValue} day(s) and ${hourValue} hour(s). Base rate: $${dailyRate.toFixed(2)} per day, plus $${hourlyOverageRate.toFixed(2)} per hour for extra hours. Total price: $${totalCost.toFixed(2)}.`;
        }

        // Set the total cost display
        document.getElementById('dayHourCostDisplay').innerText = `Total price: $${totalCost.toFixed(2)}`;

        // Find the explanation paragraph directly
        const explanationElement = document.getElementById('customExplanation');
        if (explanationElement) {
            explanationElement.innerText = explanationText;
        }
    }


    function updateCustomCostDisplay() {

        if (responseFromApi.pricing_scheme.scheme_type === 'flatRate') {
            updateCustomCostDisplayFlatRate();
        }
        if (responseFromApi.pricing_scheme.scheme_type === 'tieredRate') {
            updateCustomCostDisplayTierRate();
        }

    }

    function updateCustomCostDisplayFlatRate() {
        const customBlockTimeValue = document.getElementById('customBlockTimeValue').value;
        const flatRate = document.querySelector('input[value="custom"]').dataset.cost;
        if (customBlockTimeValue > 0) {
            const customTotalCost = (parseFloat(flatRate) * customBlockTimeValue).toFixed(2);
            document.getElementById('customCostDisplay').innerText = `Total cost: $${customTotalCost}`;
        } else {
            document.getElementById('customCostDisplay').innerText = '';
        }
    }

    function updateCustomCostDisplayTierRate() {
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

        if (optionsContainer) {
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

        let numberOfBlocks;
        if (selectedScheme.value === 'custom') {
            numberOfBlocks = document.getElementById('customBlockTimeValue').value;
            if (!numberOfBlocks || numberOfBlocks < 1) {
                alert(`Please enter a valid number of ${selectedScheme.dataset.unit}s.`);
                return;
            }
        } else {
            numberOfBlocks = selectedScheme.value;
        }

        // Collect start date or time
        const rentalStartDate = document.getElementById('rentalStartDate')?.value;
        const rentalStartTime = document.getElementById('rentalStartTime')?.value;
        const quantityInput = document.querySelector('input[name="quantity"]');
        const quantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;
        createDraftOrder(schemeId, selectedScheme.dataset.scheme, numberOfBlocks, rentalStartDate, rentalStartTime,quantity);
    }

    async function createDraftOrder(schemeId, schemeType, numberOfBlocks, rentalStartDate, rentalStartTime,quantity) {
        const variantIdElement = document.querySelector('input.product-variant-id[type="hidden"]');
        const productIdElement = document.querySelector('input.product-id[type="hidden"]');
        const variantValue = variantIdElement ? variantIdElement.value : null;

        let rentalOption = '';
        let numberOfDays = 0;
        let numberOfHours = 0;
        if (responseFromApi.pricing_scheme.scheme_type === 'dailyRate') {
            let selectedRentalOption = document.querySelector('input[name="rental_option"]:checked');
            rentalOption= selectedRentalOption.value;

            if (rentalOption === 'fullday')
            {
                numberOfDays = parseInt(document.getElementById('dayBlockInput').value, 10);
            } else if (rentalOption === 'full_day_with_hours') {
                numberOfDays = parseInt(document.getElementById('dayHourBlockValueDays').value, 10);
                numberOfHours = parseInt(document.getElementById('dayHourBlockValueHours').value, 10);
            }
        }
        const requestData = {
            shop_name: shopName,
            product_name: responseFromApi.product_name,
            product_id: productId,
            variant_id: variantValue,
            quantity: quantity,
            scheme_id: schemeId,
            scheme_type: schemeType,
            number_of_blocks: schemeType === 'dailyRate' ? (numberOfDays + numberOfHours) : numberOfBlocks,
            rental_start_date: rentalStartDate,
            rental_start_time: rentalStartTime,
            rental_option: rentalOption,
            number_of_days: numberOfDays,
            number_of_hours: numberOfHours,
            custom_properties: {
                'Product Type': 'Rental',
                'Scheme ID': schemeId,
                'Scheme Type': schemeType,
                number_of_blocks: schemeType === 'dailyRate' ? (numberOfDays + numberOfHours) : numberOfBlocks,
                'Rental Start Date': rentalStartDate,
                'Rental Start Time': rentalStartTime,
                'rental_option': rentalOption,
                'number_of_days': numberOfDays,
                'number_of_hours': numberOfHours,
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
// RentalBookingModule.init();
