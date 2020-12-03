function makeTitle(title: string): string {
  return '<h3 style="margin-bottom: 10px;">'+title+'</h3>';
}

function makeButton(title: string | boolean, href: string, style: string): string {
  return '<a style="'+style+'" href="'+href+'">'+title+'</a>';
}

function makeList(items: string[], listStyle: string, itemStyle?: string): string {
  let list = '<ul style="'+listStyle+'">';
  items.forEach((item) => {
    list += '<li style="'+itemStyle+'">'+item+'</li>';
  });
  list += '</ul>';
  return list;
}

// Styling for the chat responses.
const style = "margin-left: 0px; overflow: hidden; background-color: #fff; border: 1px solid #000; padding: 5px; border-radius: 5px;";
const buttonStyle = "background-color: #000; border: 1px solid #292929; border-radius: 3px; padding: 5px; color: #fff; text-align: center; float: right;"
