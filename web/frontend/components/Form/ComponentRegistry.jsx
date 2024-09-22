// Mapping entity types to their component dynamic imports
const componentMap = {
   // kol: () => import('./KolSpecificComponent'),
    // Add more entities and their specific components as needed
};

export const loadEntityComponent = (entity) => {
    // Return the dynamic import function or a function that resolves to null if the entity does not have a specific component
    return componentMap[entity] ? componentMap[entity]() : Promise.resolve({ default: () => null });
};
