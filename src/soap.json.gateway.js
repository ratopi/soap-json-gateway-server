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

		const callAndConvert =
			function ( client, method, args, resultAttribute, fn )
			{
				client[ method ](
					args,
					function ( err, result )
					{
						if ( err ) throw err;
						const data = convertXmlToJsObject( result[ resultAttribute ] );
						fn( data );
					}
				)
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
								callAndConvert( client, "getAirportInformationByAirportCode", args, "getAirportInformationByAirportCodeResult", fn );
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
								callAndConvert( client, "GetCurrencyByCountry", args, "GetCurrencyByCountryResult", fn );
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

		console.log( "creating clients ..." );

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
				const uptime = new Date().getTime() - startupTime;
				res.json(
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
				soapClient.airport.getAirportInformation(
					req.params.iata,
					function ( data )
					{
						res.json( data );
					}
				);
			}
		);

		app.get(
			"/airport/currency/:iata",
			function ( req, res )
			{
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
								res.json( data );
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
