export function formatDate(dateString:string,format:string){

if(!dateString) return ""

const date = new Date(dateString)

const day = String(date.getDate()).padStart(2,"0")
const month = String(date.getMonth()+1).padStart(2,"0")
const year = date.getFullYear()

switch(format){

case "DD-MM-YYYY":
return `${day}-${month}-${year}`

case "DD/MM/YYYY":
return `${day}/${month}/${year}`

case "MM-DD-YYYY":
return `${month}-${day}-${year}`

default:
return `${year}-${month}-${day}`

}

}