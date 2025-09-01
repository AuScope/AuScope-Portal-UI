export class CQLService {

    /**
     * Assembles a CQL string using filters
     * 
     * @param filters filter specification for a layer [ { predicate: string, value: []|string,  xpath: string }, ... ]
     * @returns string
     */
    public static assembleQuery(filters): string {
        let cql_str = "";
        for (const filt of filters) {
            if (filt.predicate.toUpperCase() === 'CQL_LIKE') {
                // Transform the selected filter values into a CQL query string
                let sub_str = "";
                // If there is an array of values
                if (filt.value instanceof Array) {
                    // Construct a string with terms separated by "OR" or "AND"
                    for (const val of filt.value) {
                        sub_str += filt.xpath + " LIKE '%" + val + "%' ";
                        // "OR" is default
                        if (filt.hasOwnProperty('boolOp')) {
                            sub_str += filt.boolOp + " ";
                        } else {
                            sub_str += "OR ";
                        }
                    }
                    // Trim off " AND " or " OR "  at end of string
                    if (filt.hasOwnProperty('boolOp')) {
                        sub_str = sub_str.substring(0, sub_str.length - (filt.boolOp.length + 2));
                    } else {
                        sub_str = sub_str.substring(0, sub_str.length - 4);
                    }

                // If there is a single value
                } else if (typeof filt.value === "string") {
                    sub_str = filt.xpath + " LIKE '%" + filt.value + "%'";
                }
                cql_str += sub_str
            }
        }
        return cql_str;
    }
}
