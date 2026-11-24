import JSZip from "jszip";
import Papa from "papaparse";

const leerCsv = (texto) => {
  const textoLimpio = texto.replace(/^\uFEFF/, "");
  const csvParseado = Papa.parse(textoLimpio, { header: true, skipEmptyLines: true });
  return csvParseado.data;
};

export async function leerExportDeLinkedin(archivo) {
  const csvs = {};

  if (archivo.name.toLowerCase().endsWith(".zip")) {
    //Abre el archivo zip sin guardarlo, y guarda todo en un objeto plano: {"ruta" : "datos del archivo"}
    const zip = await JSZip.loadAsync(archivo);

    for (const [ruta, entrada] of Object.entries(zip.files)) {
      if (entrada.dir || !ruta.toLowerCase().endsWith(".csv")) continue; //Salta todo lo que no sea un .csv

      const nombre = ruta.split("/").pop().toLowerCase();
      const textoDelArchivo = await entrada.async("string");
      csvs[nombre] = leerCsv(textoDelArchivo);
    }
  } else {
    const textoDelArchivo = await archivo.text();
    csvs[archivo.name.toLowerCase()] = leerCsv(textoDelArchivo);
  }

  const perfil = csvs["profile.csv"]?.[0] ?? {};
  const mails = csvs["email addresses.csv"] ?? [];
  const mailPrincipal = (mails.find((m) => m["Primary"] === "Yes") ?? mails[0])?.["Email Address"];
  const github = (perfil["Websites"] ?? "").match(
    /https?:\/\/(www\.)?(github|gitlab)\.com\/[^\s\]),]+/i,
  )?.[0];

  console.log("CSV encontrados:", Object.keys(csvs));
  console.log("Perfil:", perfil);

  const resultado = {
    nombre: perfil["First Name"],
    apellido: perfil["Last Name"],
    bio: perfil["Summary"],
    github,
    mail: mailPrincipal,
    habilidades: (csvs["skills.csv"] ?? []).map((f) => f["Name"]).filter(Boolean),
  };

  if (Object.values(resultado).every((v) => !v || v.length === 0)) {
    throw new Error("No encontramos datos de perfil en ese archivo. ¿Es el export de LinkedIn?");
  }
  return resultado;
}
