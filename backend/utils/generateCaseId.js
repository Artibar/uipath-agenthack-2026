export const generateCaseId = ()=>{
    return `CASE-${Date.now()}-${Math.floor(Math.random()*10000)}`
}