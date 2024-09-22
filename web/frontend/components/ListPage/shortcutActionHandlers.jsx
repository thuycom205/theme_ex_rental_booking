import {approveProgram, handleJoinProgram} from './entityActionHandlers';

// Dynamic action handlers map
const dynamicActionHandlers = {
    joinProgram: handleJoinProgram,
    approve:approveProgram
    // Add other dynamic action handlers here
};

const getDynamicActions = (id,item, actions) => actions.map(action => ({
    content: action.label,
    onAction: () => {
        const actionHandler = dynamicActionHandlers[action.actionType];
        if (actionHandler) {
            actionHandler(id,item);
        } else {
            console.warn(`No handler defined for action type: ${action.actionType}`);
        }
    },
}));

const defaultShortcutActions = (item, actionHandlers) => [

    {
        content: 'Edit',
        onAction: () => actionHandlers.handleEdit(item.id),
    },
    // Default actions...
];

const questionShortcutActions = (item, actionHandlers) => [
    // Entity-specific actions...
];

export const getShortcutActions = (id,entity, item, actionHandlers, schemaActions) => {
    // Check if dynamic actions are defined in the schema
    if (schemaActions && schemaActions.length > 0) {
        return getDynamicActions(id,item, schemaActions);
    }

    // Fallback to default or entity-specific actions if no dynamic actions are defined
    switch (entity) {
        case 'question':
            return questionShortcutActions(item, actionHandlers);
        //fixit:fao
        case 'whatsapp_ao_message':

            return [
                {
                    content: 'Send Message',
                    onAction: () => {
                        console.log(item);
                        const phoneNumber = item.customer_phone; // Replace with the actual phone number, in international format without the '+' sign
                        const message = item.message_content; // Replace with the actual message to send

                        // Construct the WhatsApp URL
                        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

                        // Open the WhatsApp URL
                        window.open(whatsappUrl, '_blank');
                    },
                }

            ];
        case 'whatsapp_order_message':

            return [
                {
                    content: 'Send Message',
                    onAction: () => {
                        console.log(item);
                        const phoneNumber = item.customer_phone; // Replace with the actual phone number, in international format without the '+' sign
                        const message = item.message_content; // Replace with the actual message to send

                        // Construct the WhatsApp URL
                        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

                        // Open the WhatsApp URL
                        window.open(whatsappUrl, '_blank');
                    },
                }

            ];
        //end fixit:fao
        default:
            return defaultShortcutActions(item, actionHandlers);
    }
};
