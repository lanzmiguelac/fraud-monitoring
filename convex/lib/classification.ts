// This is a backend policy floor, not a caller or environment override.
export function resolveClassificationFloor(operation:string,moduleKey?:string):'restricted'|'deny'{
  const modules=['direct_complaints','client_complaints','str_endorsements','suspensions_lifting','debit_advice','afasa_dtr','edd_endorsements','preservation_orders_warrants'];
  if(operation==='case.create'&&moduleKey===undefined)return 'restricted';
  if(operation==='monitoring.create'&&moduleKey!==undefined&&modules.includes(moduleKey))return 'restricted';
  return 'deny';
}
