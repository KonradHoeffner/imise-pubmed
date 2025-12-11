import ags from "./ag.js";
// can be executed with node.js as well for testing

/** */
export async function search(authors, year) {
	const ESEARCH_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
	let response = null;
	let json = null;
	try {
		if (authors.length === 0) {
			return `Keine Autoren vorhanden, bitte Arbeitsgruppe auswählen oder zusätzliche Autoren angeben.`;
		}
		const authorQuery = authors.map(([forename, surname]) => `${surname} ${forename}[au]`).join(" OR ");
		const searchTerm = `(${authorQuery} AND ${year}[dp]`;
		const url = `${ESEARCH_BASE}?db=pubmed&usehistory=y&term=${encodeURIComponent(searchTerm)}&retmode=json`;
		response = await fetch(url);
		json = await response.json(); // ESearch often returns XML

		let pmids = json.esearchresult.idlist;
		console.log(`Found ${pmids.length} PMIDS for the given authors, generating citation strings...`);
		if (pmids.length === 0) {
			return `Keine Publikationen gefunden für die Autoren ${authors.join(", ")} im Jahr ${year}`;
		}
		return await citations(pmids);
	} catch (e) {
		console.error("PUBMED Query error", e);
		console.log("search term:", searchTerm);
		console.log("query URL:", url);
		if (response) console.log("response", response);
		if (json) console.log("json", json);
	}
}

/** Query ESummary with the given array of PUBMED IDs
See <https://www.ncbi.nlm.nih.gov/books/NBK25499/#chapter4.ESummary> */
async function citations(pmids) {
	const BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";
	try {
		let idlist = pmids.join(",");
		const url = `${BASE}?db=pubmed&usehistory=y&id=${idlist}&retmode=json`;
		//const url = `${EFETCH_BASE}?db=pubmed&id=${idlist}&retmode=text&rettype=citation&api_key=${NCBI_API_KEY}`;
		const response = await fetch(url);
		const json = await response.json();
		delete json.uids; // redundant array of UIDs, only element that is not a publicationobjec
		let pubs = json.result;
		pubs = Object.values(pubs);
		pubs = pubs.filter((p) => p.authors && p.source && p.pubdate);
		//console.log(pubs);

		return pubs.map(nlm).sort().join("\n");
	} catch (error) {
		console.error("Error during citation generation", error);
	}
}

/** Citation string in NLM format.
p: publication object as returned by esummary with return mode json.
Details not found in <https://www.ncbi.nlm.nih.gov/books/NBK25499/#chapter4.ESummary>. */
function nlm(p) {
	// console.log(p.authors);
	const authors = p.authors.map((a) => a.name).join(", ");
	const eid = p.elocationid || "";
	const s = `${authors}. ${p.title} ${p.source}. ${p.pubdate};${p.volume}:${p.pages}. ${eid}. PMID: ${p.uid}.`;
	return s;
}

const isNode = typeof process !== "undefined" && process.versions != null && process.versions.node != null;

// local testing
if (isNode) {
	console.log("IMISE PUBMED Generator: local test for group MaGIS year 2025");
	console.log(await search(ags["magis"], 2025));
} // production use in a browser
else {
	document.getElementById("mainform").addEventListener("submit", async (event) => {
		event.preventDefault();
		const formData = new FormData(event.target);
		const year = formData.get("year");
		const ag = formData.get("ag");
		let authors = ags[ag];
		const moreAuthors = formData.get("moreauthors").trim();
		authors = authors.concat(moreAuthors.split("\n").map((a) => a.split(" ")));
		const output = document.getElementById("output");
		output.innerText = "Bitte warten...";
		output.innerText = await search(authors, year);
	});
}
