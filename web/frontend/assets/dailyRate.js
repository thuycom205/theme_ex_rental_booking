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

        if (scheme.scheme_type === 'dailyRate') {
            generateDailyRateOptions(scheme, optionsContainer);
        }

        // Add date or time picker based on the time unit
        addDatePicker(optionsContainer);
        addTimePicker(optionsContainer);

        createBookingButton(optionsContainer);
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

        if (schemeId === 'fullday') {
            const dayBlockValue = document.getElementById('dayBlockValue').value;
            totalPrice = parseFloat(selectedScheme.dataset.dailyRate) * dayBlockValue;
            numberOfBlocks = dayBlockValue;
        } else if (schemeId === 'full_day_with_hours') {
            const dayValue = document.getElementById('dayHourBlockValueDays').value;
            const hourValue = document.getElementById('dayHourBlockValueHours').value;
            const dailyRate = parseFloat(selectedScheme.dataset.dailyRate);
            const hourlyOverageRate = parseFloat(selectedScheme.dataset.hourlyOverageRate);

            totalPrice = (dailyRate * dayValue) + (hourlyOverageRate * hourValue);
            numberOfBlocks = `${dayValue} days, ${hourValue} hours`;
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
