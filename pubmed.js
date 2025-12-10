const MIG = [
	["Konrad", "Höffner"],
	["Matthias", "Löbe"],
	["Franziska", "Jahn"],
	["Birgit", "Schneider"],
	["Frank", "Meineke"],
	["Alfred", "Winter"],
	["Sebastian", "Stäubert"],
	["Christian", "Draeger"],
];
const YEAR = 2025;
//`(Höffner Konrad[au] OR Löbe Matthias[au] OR Winter Alfred[au] AND ${YEAR}[dp]`;
console.log("IMISE PUBMED Generator for year " + YEAR);
//const url = `${BASE_URL}?db=pubmed&term=${encodeURIComponent(searchTerm)}&retmode=text&rettype=uilist&usehistory=y`;
//&api_key=${NCBI_API_KEY}`;

async function search() {
	const ESEARCH_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
	let response = null;
	let json = null;
	try {
		const authors = MIG.map(([forename, surname]) => `${surname} ${forename}[au]`).join(" OR ");
		const searchTerm = `(${authors} AND ${YEAR}[dp]`;
		const url = `${ESEARCH_BASE}?db=pubmed&term=${encodeURIComponent(searchTerm)}&retmode=json`;
		response = await fetch(url);
		json = await response.json(); // ESearch often returns XML

		let pmids = json.esearchresult.idlist;
		console.log("PMIDS", pmids);
		return pmids;
	} catch (e) {
		console.error("PUBMED Query error", e);
		console.log("search term:", searchTerm);
		console.log("query URL:", url);
		if (response) console.log("response", response);
		if (json) console.log("json", json);
	}
}

async function citations(pmids) {
	const BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";
	try {
		let idlist = pmids.join(",");
		const url = `${BASE}?db=pubmed&id=${idlist}&retmode=json`;
		//const url = `${EFETCH_BASE}?db=pubmed&id=${idlist}&retmode=text&rettype=citation&api_key=${NCBI_API_KEY}`;
		const response = await fetch(url);
		const json = await response.json();
		console.log(response);
		console.log("response json", json);

		console.log("--- Retrieved Citation Strings ---");
		//		console.log(citationStrings.join("\n\n"));
	} catch (error) {
		console.error("Error during EFetch:", error);
	}
}

let pmids = await search();
await citations(pmids);
