import { AsyncIterator } from "asynciterator";
import IPath from "../interfaces/IPath";
import IQuery from "../interfaces/IQuery";

/*
                     ,-----------.            ,-----------.          ,----------------------.
                     |QueryRunner|            |RoadPlanner|          |PublicTransportPlanner|
                     `-----+-----'            `-----+-----'          `----------+-----------'
         run(query)        |                        |                           |
 -------------------------->                        |                           |
                           |                        |                           |
               ,----------------------!.            |                           |
               |Resolve ids to objects|_\           |                           |
               `------------------------'           |                           |
                           |----.                                               |
                           |    | resolveQuery(query)                           |
                           |<---'                                               |
                           |                        |                           |
                           |                        |                           |
           ___________________________________________________________________________________________
           ! OPT  /  resolved_query.roadNetworkOnly |                           |                     !
           !_____/         |                        |                           |                     !
           !               |  plan(resolved_query)  |                           |                     !
           !               | ----------------------->                           |                     !
           !~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~!
           !               |                        |                           |                     !
           !               |                plan(resolved_query)                |                     !
           !               | --------------------------------------------------->                     !
           !~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~!
                           |                        |                           |
  ,---------------------!. |                        |                           |
  |Post-processing      |_\|                        |                           |
  |of the path            ||                        |                           |
  |is left to the caller  ||                        |                           |
  `-----------------------'|                        |                           |
                           |                        |                           |

*/

/**
 * A query runner has a `run` method that turns an [[IQuery]] into an AsyncIterator of [[IPath]] instances.
 * It does this by executing one or more algorithms on the query, depending on the implementation.
 */
export default interface IQueryRunner {
  run(query: IQuery): Promise<AsyncIterator<IPath>>;
}
