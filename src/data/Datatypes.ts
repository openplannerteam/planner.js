const DATATYPE =  {
    //hier kunnen nog datatypes toegevoegd worden, specifieker dan ReducedRoutableTile
    Connections: Symbol("Connection"),
    Stops: Symbol("Stop"),
    RoutableTile: Symbol("RoutableTile"),
    TransitTile: Symbol("TransitTile"),
    ReducedRoutableTile: Symbol("ReducedRoutableTile"),
    Profile: Symbol("Profile"),
    Footpath: Symbol("Footpath"),
    Unknown: Symbol("?"),
};

export default DATATYPE;
