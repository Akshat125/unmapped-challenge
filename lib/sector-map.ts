// ISCO-08 unit groups -> ILOSTAT sector labels used in our seed data
// (ilostat_employment.json / ilostat_earnings.json). Single source of truth
// so opportunity cards consistently attach a sector to every occupation.
//
// Sectors present in seed: Agriculture, Manufacturing, Construction,
// Wholesale and retail trade, Information and communication,
// Accommodation and food service.
//
// Mapping is approximate (an ISCO unit group can span sectors in reality).
// Chosen sector is the dominant one for LMIC labor markets.

export function iscoToSector(isco: string): string {
  switch (isco) {
    case '9211': // Crop farm labourers
      return 'Agriculture';
    case '7212': // Welders
    case '7533': // Sewing workers
      return 'Manufacturing';
    case '7115': // Carpenters
    case '7126': // Plumbers
      return 'Construction';
    case '5223': // Shop sales assistants
    case '4110': // General office clerks
    case '4222': // Contact centre clerks
      return 'Wholesale and retail trade';
    case '2512': // Software developers
    case '2513': // Web developers
    case '3512': // ICT user support
    case '3514': // Web technicians
    case '7421': // Electronics mechanics
    case '7422': // ICT installers
      return 'Information and communication';
    case '5120': // Cooks
      return 'Accommodation and food service';
    case '7231': // Motor vehicle mechanics
    case '8322': // Drivers
      return 'Manufacturing';
    case '9111': // Cleaners
      return 'Accommodation and food service';
    default:
      // Fall back to the fastest-growing sector in seed for unknown ISCOs,
      // so cards still have wage+growth signals to show.
      return 'Wholesale and retail trade';
  }
}
