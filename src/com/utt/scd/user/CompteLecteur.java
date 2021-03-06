package com.utt.scd.user;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.os.AsyncTask;
import android.os.Bundle;
import android.view.View;
import android.view.View.OnClickListener;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import com.actionbarsherlock.app.SherlockFragmentActivity;
import com.actionbarsherlock.view.Menu;
import com.actionbarsherlock.view.MenuItem;
import com.actionbarsherlock.view.Window;
import com.parse.ParseException;
import com.parse.ParseObject;
import com.parse.ParseUser;
import com.utt.scd.R;
import com.utt.scd.SCD;
import com.utt.scd.apropos.Apropos;
import com.utt.scd.dialog.AlertingDialogOneButton;
import com.utt.scd.model.Connection;
import com.utt.scd.model.ConnectionNotInitializedException;
import com.utt.scd.resultats.specifiedcomponent.ListLinearLayout;
import com.utt.scd.user.alertes.Alertes;
import com.utt.scd.user.collection.Collection;

public class CompteLecteur extends SherlockFragmentActivity implements OnClickListener 
{
	
	private TextView nom_prenom;
	private Button collection, alertes;
	
	private TextView pret;
	private ListLinearLayout listLinearLayout;
	private AdapterListLinearLayoutLivres adapter;
	private List<ParseObject> livres;
	
	@Override
	protected void onCreate(Bundle savedInstanceState) 
	{
		setTheme(SCD.THEME);
		super.onCreate(savedInstanceState);
		setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
		
		requestWindowFeature(Window.FEATURE_INDETERMINATE_PROGRESS); 
		
		setContentView(R.layout.compte_lecteur);
		
		setSupportProgressBarIndeterminateVisibility(false); 
		
		getSupportActionBar().setHomeButtonEnabled(true);
		
		this.nom_prenom = (TextView) findViewById(R.id.nom_prenom);
		this.nom_prenom.setText(ParseUser.getCurrentUser().getString("nom") + " " + ParseUser.getCurrentUser().getString("prenom"));
		
		this.collection = (Button) findViewById(R.id.collection);
		this.collection.setOnClickListener(this);
		this.alertes = (Button) findViewById(R.id.alertes);
		this.alertes.setOnClickListener(this);
		
		
		this.pret = (TextView) findViewById(R.id.pret);
		this.listLinearLayout = (ListLinearLayout) findViewById(R.id.listView1);
		this.listLinearLayout.setOnClickListener(this);
		
		this.livres = new LinkedList<ParseObject>();
		
		this.adapter = new AdapterListLinearLayoutLivres(this, livres);
		this.listLinearLayout.setAdapter(adapter);
		
		new recupererLivresEmprunter().execute();
		
	}
	
	
	
	public void populateView()
	{
		if (livres != null)
		{
			if (livres.size() == 0)
			{
				this.pret.setText("Vous n'avez aucun livre � rendre");
			}
			else
			{
				this.pret.setText("Vous avez emprunt� " + livres.size() + " livre(s)");
			}
			
			this.adapter.setItems(livres);
			this.adapter = new AdapterListLinearLayoutLivres(this, livres);
			this.listLinearLayout.setAdapter(adapter);
			this.listLinearLayout.setOnClickListener(this);
			
		}
	}
	
	
	@Override
	public boolean onCreateOptionsMenu(Menu menu) 
	{
		MenuItem logout = menu.add(0,0,0,"Logout");
        {
        	logout.setIcon(R.drawable.action_logout);
        	logout.setShowAsAction(MenuItem.SHOW_AS_ACTION_IF_ROOM);           
        }
 
        MenuItem apropos = menu.add(0,1,1,"A propos");
        {
            apropos.setIcon(R.drawable.action_about);
            apropos.setShowAsAction(MenuItem.SHOW_AS_ACTION_IF_ROOM);           
        }

        
		return true;
	}
	
	
	@Override
	public boolean onOptionsItemSelected(MenuItem item) 
	{
		switch (item.getItemId()) 
		{
		
			case 0:
				
				new logout().execute();
	
				return true;
				
			case 1:
				
				Intent intent = new Intent(this,Apropos.class);
				startActivity(intent);

				return true;

	
			case android.R.id.home:
	
				this.finish();
	
				return true;
	
		};

		return false;
	}
	
	
	public class logout extends AsyncTask<String, Integer, String>
	{
		private AlertingDialogOneButton alertingDialogOneButton;
		
		private Connection connection;
		

		public logout()
		{
			connection = Connection.getInstance();
			connection.initialize();
		}

		@Override
		protected void onPreExecute() 
		{
			super.onPreExecute();
			setSupportProgressBarIndeterminateVisibility(true); 
		}
		
		@Override
		protected String doInBackground(String... arg0) 
		{
			try 
			{
				this.connection.logout();
			} 
			catch (ConnectionNotInitializedException e) 
			{
				// TODO Auto-generated catch block
				e.printStackTrace();
				return "no internet";
			}
			catch (ParseException e) 
			{
				// TODO Auto-generated catch block
				e.printStackTrace();
				return "fail";
			} 
			
			
			return "successful";
    	    
		}
		
		@Override
		protected void onPostExecute(String result) 
		{
			super.onPostExecute(result);

			setSupportProgressBarIndeterminateVisibility(false); 
			
			if(result.equals("fail"))
			{
				
				alertingDialogOneButton = AlertingDialogOneButton.newInstance("Erreur", 
																			"Erreur inconnue s'est produite, veuillez r�essayer plus tard",																			
																			R.drawable.action_alert);
				alertingDialogOneButton.show(getSupportFragmentManager(), "error 1 alerting dialog");
			}
			else if(result.equals("no internet"))
			{
				alertingDialogOneButton = AlertingDialogOneButton.newInstance("Erreur", 
																			"Probl�me de connexion, veuillez v�rifier le r�glage de connexion de votre t�l�phone",																			
																			R.drawable.action_alert);
				alertingDialogOneButton.show(getSupportFragmentManager(), "error 1 alerting dialog");
				
			}
			else if (result.equals("successful"))
			{	
				Toast.makeText(getApplicationContext(), "Votre session est ferm�e", Toast.LENGTH_LONG).show();
				
				finish();
			}
			
		}

		
		
	}
	
	
	public class recupererLivresEmprunter extends AsyncTask<String, Integer, String>
	{
		private AlertingDialogOneButton alertingDialogOneButton;
		
		private Connection connection;
		private List<ParseObject> listLivres;
		

		public recupererLivresEmprunter()
		{
			connection = Connection.getInstance();
			connection.initialize();
			
			this.listLivres = new LinkedList<ParseObject>();
		}

		@Override
		protected void onPreExecute() 
		{
			super.onPreExecute();
			setSupportProgressBarIndeterminateVisibility(true); 
		}
		
		@Override
		protected String doInBackground(String... arg0) 
		{
			try 
			{
				this.listLivres = this.connection.recupererLivresEmprunter();
			} 
			catch (ConnectionNotInitializedException e) 
			{
				// TODO Auto-generated catch block
				e.printStackTrace();
				return "no internet";
			}
			catch (ParseException e) 
			{
				// TODO Auto-generated catch block
				e.printStackTrace();
				return "fail";
			} 
			
			
			return "successful";
    	    
		}
		
		@Override
		protected void onPostExecute(String result) 
		{
			super.onPostExecute(result);

			setSupportProgressBarIndeterminateVisibility(false); 
			
			if(result.equals("fail"))
			{
				
				alertingDialogOneButton = AlertingDialogOneButton.newInstance("Erreur", 
																			"Erreur inconnue s'est produite, veuillez r�essayer plus tard",																			
																			R.drawable.action_alert);
				alertingDialogOneButton.show(getSupportFragmentManager(), "error 1 alerting dialog");
			}
			else if(result.equals("no internet"))
			{
				alertingDialogOneButton = AlertingDialogOneButton.newInstance("Erreur", 
																			"Probl�me de connexion, veuillez v�rifier le r�glage de connexion de votre t�l�phone",																			
																			R.drawable.action_alert);
				alertingDialogOneButton.show(getSupportFragmentManager(), "error 1 alerting dialog");
				
			}
			else if (result.equals("successful"))
			{	
				
				livres = this.listLivres;
				populateView();
			}
			
		}

		
		
	}

	
	@Override
	public void onClick(View v) 
	{
		if (v.equals(alertes))
		{
			Intent intent = new Intent(this, Alertes.class);
			startActivity(intent);
		}
		else if (v.equals(collection))
		{
			Intent intent = new Intent(this, Collection.class);
			startActivity(intent);
		}
		else
		{
			int position = (Integer) v.getTag();
			
			Intent intent = new Intent(this,EmpruntDetail.class);
			intent.putExtra("objectId", livres.get(position).getObjectId());
			intent.putExtra("Titre", livres.get(position).getString("Titre"));
			
			String au = "Auteur : ";
			
			@SuppressWarnings("unchecked")
			ArrayList<String> ar = (ArrayList<String>) livres.get(position).get("Auteur");
			
			if (ar.size() == 1)
			{
				au = ar.get(0);
			}
			else
			{
				for (int i = 0 ; i < ar.size() -1 ; i ++)
				{
					au += ar.get(i) + "-";
				}
				au += ar.get(ar.size()-1);
			}
			
			intent.putExtra("Auteur", au);
			intent.putExtra("Cote", livres.get(position).getString("Cote"));
			intent.putExtra("url", livres.get(position).getParseFile("couverture").getUrl());
			
			startActivity(intent);
		}
		
		
	}
}
