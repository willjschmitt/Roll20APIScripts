//return an array of objects according to key, value, or key and value matching, optionally ignoring objects in array of names
export function getObjects(obj: { [key: string]: any }, key: string, val, except?): any[] {
  except = except || [];
  let objects = [];
  for (let i in obj) {
    if (!obj.hasOwnProperty(i)) continue;
    if (typeof obj[i] == 'object') {
      if (except.indexOf(i) != -1) {
        continue;
      }
      objects = objects.concat(getObjects(obj[i], key, val));
    } else
        //if key matches and value matches or if key matches and value is not passed (eliminating the case where key matches but passed value does not)
    if (i == key && obj[i] == val || i == key && val == '') { //
      objects.push(obj);
    } else if (obj[i] == val && key == ''){
      //only add if the object is not already in the array
      if (objects.lastIndexOf(obj) == -1){
        objects.push(obj);
      }
    }
  }
  return objects;
}

export function regexIndexOf(str, regex, startpos) {
  let indexOf = str.substring(startpos || 0).search(regex);
  return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
};
