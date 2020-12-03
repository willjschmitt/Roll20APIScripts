function replaceChars(text: string): string {
  text = text.replace('\&rsquo\;', '\'').replace('\&mdash\;','—').replace('\ \;',' ').replace('\&hellip\;','…');
  text = text.replace('\&nbsp\;', ' ');
  text = text.replace('\û\;','û').replace('’', '\'').replace(' ', ' ');
  text = text.replace(/<li[^>]+>/gi,'• ').replace(/<\/li>/gi,'');
  text = text.replace(/\r\n(\r\n)+/gm,'\r\n');
  return text;
}

function getRepeatingRowIds(section, attribute, matchValue, index?) {
  let ids = [];
  if(state[state_name][beyond_caller.id].config.overwrite) {
    let matches = findObjs({ type: 'attribute', characterid: object.id })
        .filter((attr) => {
          return attr.get('name').indexOf('repeating_'+section) !== -1 && attr.get('name').indexOf(attribute) !== -1 && attr.get('current') == matchValue;
        });
    for(let i in matches) {
      let row = matches[i].get('name').replace('repeating_'+section+'_','').replace('_'+attribute,'');
      ids.push(row);
    }
    if(ids.length == 0) ids.push(generateRowID());
  }
  else ids.push(generateRowID());

  if(index == null) return ids;
  else return ids[index] == null && index >= 0 ? generateRowID() : ids[index];
}


function generateUUID(): string {
  const uuidLength = 20;
  const validCharacters = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";
  const chars: string[] = new Array(uuidLength);
  for (let i=0; i < uuidLength; ++i) {
    chars[i] = validCharacters[Math.floor(Math.random() * validCharacters.length)];
  }
  return chars.join("");
}

function generateRowID() {
  return generateUUID().replace(/_/g, "Z");
}
