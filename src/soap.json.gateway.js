const createSoapClient =
	function ( fn )
	{
		const xml2json = require( "xml2json" );

		const soap = require( "soap" );

		const wsdl = "http://www.webservicex.net/airport.asmx?WSDL";

		soap.createClient(
			wsdl,
			function ( err, client )
			{
				if ( err ) throw err;

				const getAirportInformation =
					function ( airportCode, fn )
					{
						const args = { "airportCode": airportCode };

						client.getAirportInformationByAirportCode(
							args,
							function ( err, result )
							{
								const data = JSON.parse( xml2json.toJson( result.getAirportInformationByAirportCodeResult ) );
								fn( data );
							}
						);
					};

				console.log( "soap client created" );

				fn(
					{
						"getAirportInformation": getAirportInformation
					}
				);

			}
		);
	};


const startWebServer =
	function ( soapClient )
	{
		const startupTime = new Date().getTime();

		const app = require( "express" )();

		app.get(
			"/",
			function ( req, res )
			{
				const uptime = new Date().getTime() - startupTime;
				res.send( "soap.json.gateway running " + uptime + "ms" );
			}
		);

		app.get(
			"/airport/information/:iata",
			function ( req, res )
			{
				res.type( 'application/json' );

				soapClient.getAirportInformation(
					req.params.iata,
					function ( data )
					{
						res.send( JSON.stringify( data ) );
					}
				);
			}
		);

		app.listen(
			3000,
			function ()
			{
				console.log( "web server started; listening on port 3000" );
			}
		);

	};


createSoapClient( startWebServer );
