import pandas as pd
import numpy as np
import random

def generate_data(n_samples=10000):
    """
    Generates a synthetic dataset mimicking UPI transactions.
    """
    
    np.random.seed(42)
    random.seed(42)

    data = {
        'step': np.random.randint(1, 744, n_samples), # Simulation steps (hours in a month)
        'type': np.random.choice(['PAYMENT', 'TRANSFER', 'CASH_OUT', 'DEBIT', 'CASH_IN'], n_samples, p=[0.4, 0.2, 0.2, 0.1, 0.1]),
        'amount': [],
        'nameOrig': [],
        'oldbalanceOrg': [],
        'newbalanceOrig': [],
        'nameDest': [],
        'oldbalanceDest': [],
        'newbalanceDest': [],
        'isFraud': []
    }

    for _ in range(n_samples):
        # Transaction Type logic
        t_type = data['type'][_]
        
        # Fraud Probability (higher for TRANSFER and CASH_OUT)
        is_fraud = 0
        if t_type in ['TRANSFER', 'CASH_OUT']:
            if random.random() < 0.05: # 5% chance of fraud in these types
                is_fraud = 1
        
        data['isFraud'].append(is_fraud)

        # Amount
        if is_fraud:
            amount = round(random.uniform(10000, 1000000), 2) # High amount for fraud
        else:
            amount = round(random.uniform(10, 5000), 2) # Normal amounts
        data['amount'].append(amount)

        # Origin Accounts
        data['nameOrig'].append(f'C{random.randint(10000000, 99999999)}')
        old_bal_org = round(random.uniform(amount, amount + 50000), 2)
        data['oldbalanceOrg'].append(old_bal_org)
        
        # New Balance Origin
        if t_type == 'CASH_IN':
             new_bal_org = old_bal_org + amount
        else:
             new_bal_org = max(0, old_bal_org - amount)
        data['newbalanceOrig'].append(round(new_bal_org, 2))

        # Destination Accounts
        data['nameDest'].append(f'M{random.randint(10000000, 99999999)}')
        old_bal_dest = round(random.uniform(0, 50000), 2)
        data['oldbalanceDest'].append(old_bal_dest)
        
        # New Balance Destination
        if t_type == 'CASH_IN' or t_type == 'DEBIT': # Logic varies, keeping simple
             new_bal_dest = old_bal_dest - amount # Debit means money leaves? keeping simple for model
        else:
             new_bal_dest = old_bal_dest + amount
        
        # Fix logic for destination to ensure it makes sense for model
        # If fraud, sometimes money "disappears" or destination is flagged
        # For this simple model, simple arithmetic is enough.
        data['newbalanceDest'].append(round(new_bal_dest, 2))

    df = pd.DataFrame(data)
    
    # Force some specific fraud patterns
    # e.g., TRANSFER of full amount
    mask = (df['isFraud'] == 1) & (df['type'] == 'TRANSFER')
    df.loc[mask, 'newbalanceOrig'] = 0
    df.loc[mask, 'amount'] = df.loc[mask, 'oldbalanceOrg']

    print(f"Generated {n_samples} transactions.")
    print(f"Fraud count: {df['isFraud'].sum()}")
    
    df.to_csv('transactions.csv', index=False)
    print("Saved to transactions.csv")

if __name__ == "__main__":
    generate_data()
