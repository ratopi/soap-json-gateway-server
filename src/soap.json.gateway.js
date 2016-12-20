const createClients =
	function ( fn )
	{
		const xml2json = require( "xml2json" );
		const soap = require( "soap" );

		const interf = {};

		const convertXmlToJsObject =
			function ( xml )
			{
				return JSON.parse( xml2json.toJson( xml ) );
			};

		const checkIfInterfaceComplete =
			function ()
			{
				if ( interf.airport && interf.country )
				{
					fn( interf );
				}
			};

		const createAirportClient =
			function ()
			{
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
										if ( err ) throw err;
										const data = convertXmlToJsObject( result.getAirportInformationByAirportCodeResult );
										fn( data );
									}
								);
							};

						console.log( "airport soap client created" );

						interf.airport =
						{
							"getAirportInformation": getAirportInformation
						};

						checkIfInterfaceComplete();
					}
				);
			};

		const createCountryClient =
			function ()
			{
				const wsdl = "http://www.webservicex.net/country.asmx?WSDL";

				soap.createClient(
					wsdl,
					function ( err, client )
					{
						if ( err ) throw err;

						const getCurrencyByCountry =
							function ( countryName, fn )
							{
								const args = { "CountryName": countryName };

								client.GetCurrencyByCountry(
									args,
									function ( err, result )
									{
										if ( err ) throw err;
										const data = convertXmlToJsObject( result.GetCurrencyByCountryResult );
										fn( data );
									}
								);
							};

						console.log( "currency soap client created" );

						interf.country =
						{
							"getCurrencyByCountry": getCurrencyByCountry
						};

						checkIfInterfaceComplete();
					}
				);
			};

		createAirportClient();
		createCountryClient();
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
				res.type( 'application/json' );

				const uptime = new Date().getTime() - startupTime;
				res.send(
					{
						"app": "soap.json.gateway",
						"uptime": uptime,
						"started": startupTime
					}
				);
			}
		);

		app.get(
			"/airport/information/:iata",
			function ( req, res )
			{
				res.type( 'application/json' );

				soapClient.airport.getAirportInformation(
					req.params.iata,
					function ( data )
					{
						res.send( data );
					}
				);
			}
		);

		app.get(
			"/airport/currency/:iata",
			function ( req, res )
			{
				res.type( 'application/json' );

				soapClient.airport.getAirportInformation(
					req.params.iata,
					function ( airportData )
					{
						var data = {};
						data.airport = airportData;

						console.log( "got airport data" );
						console.log( "Now querying currency for " + data.airport.NewDataSet.Table[ 0 ].Country );

						soapClient.country.getCurrencyByCountry(
							data.airport.NewDataSet.Table[ 0 ].Country,
							function ( currencyData )
							{
								data.currency = currencyData;
								res.send( data );
							}
						);
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


createClients( startWebServer );
