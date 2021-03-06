Parse.Cloud.useMasterKey();

Parse.Cloud.afterSave("_User", function(request) {

	//var push_times = request.object.get('push_times');
	 

	var currentUser = Parse.User.current();
	var islogged = currentUser.get('is_logging');
	var installationId = currentUser.get('installationId');

	// Si l'utilisateur s'identifie, le paramètre is_logging = 1; Quand l'utilisateur logout, le paramètre is_loggin = 0
	if (islogged == 1)
	{

		var pushQuery = new Parse.Query(Parse.Installation); 
		pushQuery.equalTo('installationId', installationId); 
		// Get installationId utilisé par utilisateur, s'il s'identifie la deuxième fois ds un autre téléphone, le champ installationId de cet user sera mis à jour (nouvelle valeur) et tous les téléphones seront notifiés
		
		alert("Installation Id : " + installationId);
		
		pushQuery.find({
			success: function(resultats) 
			{
				alert("Il y a au total : " + resultats.length + " téléphone qui va recevoir éventuellement des push notifications." );	
			},

			error: function(error) 
			{
				alert("Il n'y a pas de téléphone qui va recevoir éventuellement des push notification." );	
			}
		});
		
		
		
		
		var exemplaire = Parse.Object.extend("Exemplaire");
		var queryEx = new Parse.Query(exemplaire);
		queryEx.equalTo("emprunte_par", currentUser);
		
		queryEx.find({
			success: function(exemplaires_empruntes) 
			{
				alert("Nombre d'exemplaires empruntés est : " + exemplaires_empruntes.length + " exemplaires.");
				// Pour chaque exemplaire, on planifie envoyer une notification Push pour la date de retour
				for (var i = 0; i < exemplaires_empruntes.length; i++) 
				{
					var ex = exemplaires_empruntes[i];
					
					var liv = null;
					
					var relation = ex.relation("exemplaire_de");
					
					relation.query().find({
						success: function(livre_emprunte) 
						{
							alert("Nombre de livres empruntés est : " + livre_emprunte.length + " livres.");
							liv = livre_emprunte[0];
							
							
							var post = ex.get('etat') + " " + ex.get('retour');
					
							if (liv != null)
							{
								post = post + liv.get('Titre');
							}
							
							alert('Livre ' + i + ' ' + post);
							
							var date = new Date(ex.get('retour'));
							var date_retour = date.toLocaleString();
							
							Parse.Push.send(
							{
								where: pushQuery, // Set our Installation query
								data: 
								{
									action: "com.utt.scd.EMPRUNT",
									titre: liv.get('Titre'), 
									alert: "Bonjour M." + currentUser.get('nom') + ", vous avez des livres à rendre le " + date_retour
								},
								//push_time: date,
								//expiration_interval: 86400,
							}, 
							{
								success: function() 
								{
									// Push was successful
								},
								error: function(error) 
								{
									throw " Got an error " + error.code + " : " + error.message;
								}
							});
	
						},
						error: function(error) 
						{
							alert("Error: " + error.code + " " + error.message);
						}
					});
				
					
				}
			},
			error: function(error) 
			{
				alert("Error: " + error.code + " " + error.message);
			}
		});
		
		
		
		
		
		
		
		/*var relation = currentUser.relation("emprunte");
		
		relation.query().find({
			success: function(resultats) 
			{

				alert("Il y a au total : " + resultats.length + " livre à rendre " );
						
				for (var i = 0; i < resultats.length; i++) 
				{

					var post = resultats[i].get('etat') + " " + resultats[i].get('retour');

					alert('Livre ' + i + ' ' + post);
					
					var date = new Date(resultats[i].get('retour'));
					
					Parse.Push.send(
					{
						where: pushQuery, // Set our Installation query
						data: 
						{
							alert: "Bonjour M." + currentUser.get('nom') + ", vous avez des livres à rendre le " + date
						},
						//push_time: date,
						//expiration_interval: 86400,
					}, 
					{
						success: function() 
						{
							// Push was successful
						},
						error: function(error) 
						{
							throw " Got an error " + error.code + " : " + error.message;
						}
					});
				}
						
			},
			error: function(error) 
			{
				alert("Error: " + error.code + " not found " + error.message);
			}
		});*/
	}

});



Parse.Cloud.afterSave("Exemplaire", function(request, response) {
	
	var exemplaire = request.object
	
	if (exemplaire.get('etat') == "Disponible")
	{
		var exemplaire_de = exemplaire.relation("exemplaire_de");
		
		exemplaire_de.query().find({
			success: function(livres) 
			{
				alert("Il y a au total : " + livres.length + " livre " );
						
				/*for (var i = 0; i < livres.length; i++) 
				{
					var post = livres[i].get('Titre') + " " + livres[i].get('Editeur');

					alert('Livre : ' + i + ' ' + post);		
				}*/
				var livre = livres[0];
				var livre_description = livre.get('Titre') + " " + livre.get('Editeur');
				
				alert('Livre : ' + livre_description);	
				
				var notifier_a;
				if (exemplaire.get('duree_pret') == "Long")
				{
					notifier_a = livre.relation("notifier_long");
				}
				else if (exemplaire.get('duree_pret') == "Court")
				{
					notifier_a = livre.relation("notifier_court");
				}
				 
				
				notifier_a.query().find({
					success: function(utilisateurs) 
					{
						alert("Il y a au total : " + utilisateurs.length + " utilisateur à notifier " );
								
						for (var i = 0; i < utilisateurs.length; i++) 
						{
							var user = utilisateurs[i];
							
							var user_description = user.get('nom') + " " + user.get('prenom');

							alert('User : ' + i + ' ' + user_description);		
							
							alert("Installation Id : " + user.get('installationId') );
							
							
							var pushQuery = new Parse.Query(Parse.Installation); 
							pushQuery.equalTo('installationId', user.get('installationId'));
		
							pushQuery.find({
								success: function(resultats) 
								{
									alert("Il y a au total : " + resultats.length + " téléphone qui va recevoir éventuellement des push notifications." );	
								},

								error: function(error) 
								{
									alert("Il n'y a pas de téléphone qui va recevoir éventuellement des push notification." );	
								}
							});
							
							
							if (user.get('is_alerted'))
							{
								Parse.Push.send(
								{
									where: pushQuery, // Set our Installation query
									data: 
									{
										action: "com.utt.scd.ALERTE",
										titre: livre.get('Titre'),
										type: exemplaire.get('duree_pret'),
										alert: "Bonjour M." + user.get('nom') + ", un exemplaire du livre " + livre.get('Titre') + " de type " + exemplaire.get('duree_pret') + " est disponible"
									},
									//expiration_interval: 86400,
								}, 
								{
									success: function() 
									{
										// Push was successful
									},
									error: function(error) 
									{
										throw " Got an error " + error.code + " : " + error.message;
									}
								});
							}
							
							
						}
								
					},
					error: function(error) 
					{
						alert("Error: " + error.code + " Utilisateur non trouvé " + error.message);
					}
				});
				
						
			},
			error: function(error) 
			{
				alert("Error: " + error.code + " livre not non trouvé " + error.message);
			}
		});
	}
	
});




// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
/*Parse.Cloud.define("hello", function(request, response) {
	response.success("Hello world!");
});

Parse.Cloud.afterSave("_User", function(request) {

	//var push_times = request.object.get('push_times');
	 
	var pushQuery = new Parse.Query(Parse.Installation);
	//pushQuery.equalTo('channels', 'Giants');
	pushQuery.equalTo('objectId', 'MXf6jPGLbb');
	
	var currentUser = Parse.User.current();
	
	// Find all livres by the current user

	var relation = currentUser.relation("emprunte");
			
	relation.query().find({
	success: function(resultats) {
		// userPosts contains all of the posts by the current user.
		alert("Successfully retrieved " + resultats.length + "hehe" );
				
		for (var i = 0; i < resultats.length; i++) 
		{
			// This does not require a network access.
			var post = resultats[i].get('etat') + " " + resultats[i].get('retour');
			alert(post);
			
			var date = new Date(resultats[i].get('retour'));
			
			Parse.Push.send(
			{
				where: pushQuery, // Set our Installation query
				data: 
				{
					//alert: "New comment: Trung" + request.user.get('username')
					alert: "Bonjour M." + currentUser.get('nom') + ", vous avez des livres à rendre " + date
				},
				//push_time: date
			}, 
			{
				success: function() 
				{
					 // Push was successful
				},
				error: function(error) 
				{
					  throw "Got an error " + error.code + " : " + error.message;
				}
			});
		}
				
	},
		error: function(error) {
			alert("Error: " + error.code + " not found " + error.message);
		}
	});
	
	/*Parse.Push.send(
	{
		where: pushQuery, // Set our Installation query
		data: 
		{
			//alert: "New comment: Trung" + request.user.get('username')
			alert: "New comment: Trung" + currentUser.get('username')
		}
	}, 
	{
		success: function() 
		{
			 // Push was successful
		},
		error: function(error) 
		{
			  throw "Got an error " + error.code + " : " + error.message;
		}
	});
	
    
	/*for (var i = 0; i < push_times.length; i++) 
	{
		Parse.Push.send(
		{
			channels: ["Giants"] // Set our Installation query
			data: 
			{
				alert: "New comment: " + push_times[i]
			}
		}, 
		{
			success: function() 
			{
			  // Push was successful
			},
			error: function(error) 
			{
			  throw "Got an error " + error.code + " : " + error.message;
			}
		});
         
	}	
	
});



Parse.Cloud.afterSave("Exemplaire", function(request, response) {
	//Parse.Cloud.useMasterKey();
	//response.success();
	
	//Ici notifier eventuellement à tous les utilisateurs si un exemplaire devient dispo
});*/



