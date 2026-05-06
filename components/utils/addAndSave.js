import { getItemAsync, setItemAsync, deleteItemAsync } from "./customSecureStore";

export default async function addAndSave({
  propertyName,
  newValue,
  propertyCheck,
}) {
  if ((propertyName === "supplier")){
    await setItemAsync(propertyName, JSON.stringify(newValue));
    return 
  }
  else if (propertyName === "termsandconditions"){
    let propertyValues = await getItemAsync(propertyName);
    propertyValues = propertyValues ? JSON.parse(propertyValues) : [];
    
    if (typeof newValue === "object" && newValue !== null && newValue.title) {
      const idx = propertyValues.findIndex(item => 
        (typeof item === "object" && item.title === newValue.title) || 
        (typeof item === "string" && item === newValue.title)
      );
      if (idx !== -1) {
        propertyValues[idx] = newValue;
      } else {
        propertyValues.push(newValue);
      }
    } else {
      propertyValues.push(newValue);
    }
    
    await setItemAsync(propertyName, JSON.stringify(propertyValues));
    return;
  }
 
  let propertyValues = await getItemAsync(propertyName);
  propertyValues = propertyValues ? JSON.parse(propertyValues) : [];
  
  var index = -1;
  
  if (propertyName === "quotations" || propertyName === "quotation") {
    index = propertyValues.findIndex(
      (item) => (item.quotationPrefix === newValue.quotationPrefix) && (item.quotationNumber === newValue.quotationNumber)
    );
  } else if (propertyName === "invoices" || propertyName === "invoice") {
    index = propertyValues.findIndex(
      (item) => (item.invoicePrefix === newValue.invoicePrefix) && (item.invoiceNumber === newValue.invoiceNumber)
    );
  } else {
    index = propertyValues.findIndex(
      (item) => item[propertyCheck] === newValue[propertyCheck]
    );
  }

  if (index !== -1) {
    propertyValues[index] = newValue;
  } else {
    propertyValues.push(newValue);
  }

  await setItemAsync(propertyName, JSON.stringify(propertyValues));
}

