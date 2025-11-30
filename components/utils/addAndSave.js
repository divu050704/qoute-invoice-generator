import { getItemAsync, setItemAsync } from "expo-secure-store";

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
    propertyValues.push(newValue)
    return 

  }
 
  let propertyValues = await getItemAsync(propertyName);
  // Convert to array or default to empty array
  propertyValues = propertyValues ? JSON.parse(propertyValues) : [];
  // Find existing item by unique key (name)
  var index;
  if (propertyName !== "quotations") {
    index = propertyValues.findIndex(
      (item) => item[propertyCheck] === newValue[propertyCheck]
    );
  }
  
  else{
    index = propertyValues.findIndex(
      (item) => ((item.quotationDate === newValue.quotationDate) && (item.quotationPrefix === newValue.quotationPrefix) && (item.quotationNumber === newValue.quotationNumber))
    );
  }


  if (index !== -1) {
    // Update existing
    propertyValues[index] = newValue;
  } else {
    // Add new entry
    propertyValues.push(newValue);
  }

  // Save back to SecureStore
  await setItemAsync(propertyName, JSON.stringify(propertyValues));
}
