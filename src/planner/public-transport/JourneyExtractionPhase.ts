/**
 * Signifies different phases of the journey extraction algorithm
 * Dependencies of [[IJourneyExtractor]] implementations can be tagged with one of these phases,
 * so the algorithm knows which dependency to use at which time.
 * This is especially useful when the algorithm could potentially use different implementations of
 * the same interface at each phase
 */
enum JourneyExtractionPhase {
  Initial = "journeyExtractionInitial",
  Transfer = "journeyExtractionTransfer",
  Final = "journeyExtractionFinal",
}

export default JourneyExtractionPhase;
