/**
 * Signifies different phases at which reachable stops can be searched for
 * Classes that use [[IReachableStopsFinder]] implementations can use these to tag different dependencies
 * This is especially useful when the class could potentially use different implementations of
 * the same [[IReachableStopsFinder]] interface at each phase
 */
enum ReachableStopsSearchPhase {
  Initial = "reachableStopsSearchInitial",
  Transfer = "reachableStopsSearchTransfer",
  Final = "reachableStopsSearchFinal",
}

export default ReachableStopsSearchPhase;
