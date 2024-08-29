const RentalBookingModule = (function () {
    let schemeId = 0;
    let explanationText = '';
    let totalCost = 0;
    let numberOfBlocks = 0;
    let numberOfDays = 0;
    let numberOfHours = 0;

    // Initialize the rental booking module
    function init() {
        schemeId = document.getElementById('scheme_id')?.innerText || 0;
        attachEventListeners();
        explanationText = '';
        totalCost = 0;
        numberOfBlocks = 0;
        numberOfDays = 0;
        numberOfHours = 0;
        // Select the button element with the name "add"
        const addButton = document.querySelector('button[name="add"]');

// Check if the button exists, then hide it
        if (addButton) {
            addButton.style.display = 'none';
        } else {
            console.error('Button with name "add" not found.');
        }
// Select the div element with the data-shopify attribute value of "payment-button"
        const paymentButtonDiv = document.querySelector('div[data-shopify="payment-button"]');

// Check if the div exists, then hide it
        if (paymentButtonDiv) {
            paymentButtonDiv.style.display = 'none';
        } else {
            console.error('Div with data-shopify="payment-button" not found.');
        }

    }

    // Attach event listeners for dynamic price calculation and booking
    function attachEventListeners() {
        document.addEventListener('change', function (event) {
            if (
                event.target.name === 'rental_option' ||
                event.target.id === 'customBlockTimeValue' ||
                event.target.name === 'dayBlockValue' ||
                event.target.id === 'dayHourBlockValueDays' ||
                event.target.id === 'dayHourBlockValueHours' ||
                event.target.id === 'dayBlockValue'
            ) {
                updateCustomCostDisplay();
            }

            if (event.target.id === 'rental_daily_full') {
                document.getElementById('dayBlockInput').style.display = 'block';
                document.getElementById('dayHourBlockInput').style.display = 'none';
            } else if (event.target.id === 'rental_daily_hours') {
                document.getElementById('dayBlockInput').style.display = 'none';
                document.getElementById('dayHourBlockInput').style.display = 'block';
            }
        });

        const bookingButton = document.querySelector('.book-now-button');
        if (bookingButton) {
            bookingButton.addEventListener('click', handleBooking);
        }
    }

    // Update the display of the custom cost
    function updateCustomCostDisplay() {
        const customBlockTimeValue = parseInt(document.getElementById('customBlockTimeValue')?.value || 0, 10);
        const selectedOption = document.querySelector('input[name="rental_option"]:checked');

        if (selectedOption) {
            totalCost = parseFloat(selectedOption.dataset.baseRate || 0);
            explanationText = '';
            const schemeType = selectedOption.dataset.scheme;
            console.log(schemeType);

            switch (schemeType) {
                case 'tieredRate':
                    handleTieredRate(selectedOption, customBlockTimeValue);
                    break;
                case 'flatRate':
                    handleFlatRate(selectedOption, customBlockTimeValue);
                    break;
                case 'dailyRate':
                    handleDailyRate(selectedOption);
                    break;
                default:
                    break;
            }

            document.getElementById('finalrentalPriceunit').innerText = `Total cost: ${Shopify.currency.active} ${totalCost.toFixed(2)}`;
            document.getElementById('customExplanation').innerText = explanationText;
            console.log('totalCost:', totalCost);
            console.log('explanationText:', explanationText);
            document.getElementById('customExplanation').style.display = 'block';
        } else {
            document.getElementById('finalrentalPriceunit').innerText = '';
            document.getElementById('customExplanation').style.display = 'none';
        }
    }

    function handleTieredRate(selectedOption, customBlockTimeValue) {
        const selectedValue = parseInt(selectedOption.value, 10);
        if (!isNaN(selectedValue)) {
            customBlockTimeValue = selectedValue;
        }
        const initialPeriod = parseInt(selectedOption.dataset.initialPeriod, 10);
        const additionalUnits = customBlockTimeValue - initialPeriod;
        numberOfBlocks =customBlockTimeValue;

        if (additionalUnits > 0) {
            totalCost += additionalUnits * parseFloat(selectedOption.dataset.subsequentRate);

        }

        explanationText = `You selected ${customBlockTimeValue} ${selectedOption.dataset.timeUnit}(s). Base rate: $${totalCost.toFixed(2)}`;
        if (additionalUnits > 0) {
            explanationText += `, including $${(additionalUnits * parseFloat(selectedOption.dataset.subsequentRate)).toFixed(2)} for ${additionalUnits} additional ${selectedOption.dataset.timeUnit}(s).`;
        }
    }

    function handleFlatRate(selectedOption, customBlockTimeValue) {
        // Check if selectedOption.value is an integer
        const selectedValue = parseInt(selectedOption.value, 10);
        if (!isNaN(selectedValue)) {
            customBlockTimeValue = selectedValue;
        }

        numberOfBlocks =customBlockTimeValue;

        totalCost *= customBlockTimeValue;
        explanationText = `You selected ${customBlockTimeValue} ${selectedOption.dataset.timeUnit}(s). Total cost: $${totalCost.toFixed(2)}.`;
    }


    function handleDailyRate(selectedOption) {
        const daily_rate = parseFloat(selectedOption.dataset.dailyRate);

        if (selectedOption.value ==='full_day_with_hours') {
            const days = parseInt(document.getElementById('dayHourBlockValueDays').value || 1, 10);
            const hours = parseInt(document.getElementById('dayHourBlockValueHours').value || 0, 10);

            totalCost = days * daily_rate + hours * parseFloat(selectedOption.dataset.hourlyOverageRate);
            explanationText = `You selected ${days} day(s) and ${hours} hour(s). Total cost: $${totalCost.toFixed(2)}.`;
            numberOfBlocks = days + hours;
            numberOfDays = days;
            numberOfHours = hours;
        } else if (selectedOption.value ==='fullday')  {
            const days = parseInt(document.getElementById('dayBlockValue').value || 1, 10);
            totalCost = days * daily_rate ;
            console.log(days);
            numberOfBlocks = days;
            explanationText = `You selected ${days} day(s) . Total cost: $${totalCost.toFixed(2)}.`;
            numberOfDays = days;
            numberOfHours = 0;
        }
    }

    // Handle booking process
    async function handleBooking() {
        const selectedOption = document.querySelector('input[name="rental_option"]:checked');
        if (!selectedOption) {
            alert('Please select a rental option.');
            return;
        }
        const bookingButton = document.querySelector('.book-now-button');
        if (bookingButton) {
            bookingButton.disabled = true;
            bookingButton.innerText = 'Processing...';
        }
        const rentalStartDate = document.getElementById('rentalStartDate')?.value;
        const rentalStartTime = document.getElementById('rentalStartTime')?.value;
        const customBlockTimeValue = document.getElementById('customBlockTimeValue')?.value || 1;
        const variantId = document.querySelector('input.product-variant-id[type="hidden"]')?.value;
        const quantity = parseInt(document.querySelector('input[name="quantity"]')?.value || '1', 10);
// Select the element with the class 'rental-product-title'
        const rentalProductTitleElement = document.querySelector('.rental-product-title');

        let productTitle = '';
        let productId = 0;

        if (rentalProductTitleElement) {
            // Get the value of the data-product-title attribute
            productTitle = rentalProductTitleElement.dataset.productTitle;

            if (!productTitle) {
                return;
            }
        } else {
            return;
        }
        const rentalProductIdElement = document.querySelector('.rental-product-id');

        if (rentalProductIdElement) {
            // Get the value of the data-product-id attribute
            productId = rentalProductIdElement.dataset.productId;

            if (!productId) {
                return;
            }
        } else {
            return;
        }
        const requestData = {
            shop_name:Shopify.shop,
            product_name: productTitle,
            product_id: productId,
            variant_id: variantId,
            quantity : quantity,
            scheme_id: schemeId,
            scheme_type: selectedOption.dataset.scheme,
            number_of_blocks: numberOfBlocks,
            rental_start_date: rentalStartDate,
            rental_start_time: rentalStartTime,
            rental_option: selectedOption.value,
            number_of_days: numberOfDays,
            number_of_hours: numberOfHours,
            custom_properties: {
                'Product Type': 'Rental',
                'Scheme ID': schemeId,
                'Scheme Type': selectedOption.dataset.scheme,
                'number_of_blocks': numberOfBlocks,
                'Rental Start Date': rentalStartDate,
                'Rental Start Time': rentalStartTime,
                'rental_option': selectedOption.value,
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
            if (bookingButton) {
                bookingButton.disabled = false;
                bookingButton.innerText = 'Book Now';
            }
        }
    }

    return {
        init: init
    };
})();

document.addEventListener('DOMContentLoaded', function () {
    RentalBookingModule.init();
});
