// entityActionHandlers.js

export const getEntityActionHandlers = (entity, navigate, shopxName, token) => {
    // Infer entity as 'quiz' if undefined and URL has 'quiz'
    if (!entity && window.location.href.includes('quiz')) {
        entity = 'quiz';
    }
    switch(entity) {
        // case 'quiz':
        //     return {
        //         handleEdit: (id) => {
        //             const oriUrl = encodeURIComponent(window.location.href);
        //             const srcUrl = `https://colab.ngrok.app/jsplumb.html?id=${id}&shop=${encodeURIComponent(shopxName)}&host=${encodeURIComponent(token)}&oriUrl=${oriUrl}`;
        //             // For quiz, navigate differently
        //             window.location.href = srcUrl;
        //         }
        //         // Other quiz-specific actions can be defined here
        //     };

            case 'quiz_answer':
            return {
                handleEdit: (id) => {
                    const oriUrl = encodeURIComponent(window.location.href);
                    const srcUrl = `https://colab.ngrok.app/admin_view_answer.html?id=${id}&shop=${encodeURIComponent(shopxName)}&host=${encodeURIComponent(token)}&oriUrl=${oriUrl}`;
                    // For quiz, navigate differently
                    window.location.href = srcUrl;
                }
                // Other quiz-specific actions can be defined here
            };
        default:
            return {
                handleEdit: (id) => {
                    const url = window.location.href;
                    const match = url.match(/hostz\/([^\/]+)/);
                    let hostPart = '';
                    if (match) {
                        hostPart = `hostz/${match[1]}/`;
                    }
                    const editUrl = `/page_form/${entity}/${hostPart}editId/${id}/shop_name/${shopxName}`;
                    navigate(editUrl);
                }
                // Default actions for other entities
            };
    }
};

export const handleJoinProgram =async (id,item) => {


    console.log(`Joining program for kol ID: ${id}`);
    console.log(`Joining program for item ID: ${item.id}`);
    const submitUrl = `/api/kol/admin_assign_rule_for_kol`;
    //fix it:thuy
    const shopxName = localStorage.getItem('shop')
    const payload = {
        kol_id: id,
        rule_id: item.id,
        shop_name: shopxName
    };

    try {
        const response = await fetch(submitUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
           // onFormSubmit('Form submitted successfully.');
            //setSubmissionStatus({ loading: false, error: '' });

            throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            alert (data.message);

        }

        const data = await response.json();
        alert (data.message);
       // setSubmissionStatus({ loading: false, error: '' });

       // onFormSubmit('Form submitted successfully.');


    } catch (error) {
        console.error('Failed to submit form:', error);
       // onFormSubmit('Failed to submit form.');

       // setSubmissionStatus({ loading: false, error: error.message });

    }
    // Implement your action logic here. For example, navigate to a URL or execute specific code
};
export const approveProgram = (id,item) => {


    console.log(`approve program for kol ID: ${id}`);
    console.log(`approve program for item ID: ${item.id}`);
    return item.id;
    // Implement your action logic here. For example, navigate to a URL or execute specific code
};
