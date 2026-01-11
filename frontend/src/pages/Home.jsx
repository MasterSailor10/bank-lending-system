import { Component } from "react";
import { Navigate } from "react-router-dom";
import "../App.css";

const optionList = [
  { optionId: "create-loan", displayText: "Create A New Loan" },
  { optionId: "loan-payment", displayText: "Loan Payment" },
  { optionId: "loan-detail", displayText: "View Loan Details and Payment History" },
  { optionId: "view-loans", displayText: "View All My Loans" },
];

const emiOptionsList = [
  { optionId: "LUMP_SUM", displayText: "LUMPSUM" },
  { optionId: "EMI", displayText: "EMI" },
];

class Home extends Component {
  state = {
    activeOptionId: optionList[0].optionId,
    backendResult: "",
    selectedLoan: null,
    allLoans: [],
    emistatus: emiOptionsList[0].optionId,
    loanNumber: "",
    paymentAmount: "",
    userData: null,
    shouldLogout: false,
  };

  componentDidMount() {
    this.fetchUserData();
  }

  // Fetch current user data
  fetchUserData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("http://localhost:5000/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        this.setState({ userData });
      }
    } catch (error) {
      console.error("Failed to fetch user data", error);
    }
  };

  handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isLoggedIn");
    this.setState({ shouldLogout: true });
  };

  onChangeOptions = (event) => {
    this.setState({
      activeOptionId: event.target.value,
      backendResult: "",
      selectedLoan: null,
      allLoans: [],
      firstOption: false,
      secondOption: false,
      thirdOption: false,
      fourthOption: false,
      emistatus: emiOptionsList[0].optionId,
      loanNumber: "",
      paymentAmount: "",
    });
  };

  // Helper function to get auth headers
  getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // Handling API 1: Create Loan
  handleCreateLoanSubmit = async (event) => {
    event.preventDefault();
    this.setState({
      firstOption: false,
      secondOption: false,
      thirdOption: false,
      fourthOption: false,
    });

    const formData = new FormData(event.target);
    const data = {
      loan_amount: parseFloat(formData.get("loanAmount")),
      loan_period_years: parseFloat(formData.get("loanPeriod")),
    };

    try {
      const response = await fetch("http://localhost:5000/loans/", {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!response.ok) {
        this.setState({ 
          backendResult: { error: result.error }, 
          firstOption: true 
        });
      } else {
        this.setState({ backendResult: result, firstOption: true });
      }
    } catch  {
      this.setState({ 
        backendResult: { error: "Network error" }, 
        firstOption: true 
      });
    }
  };

  // Handling API 2: Loan Payment
  handleLoanPaymentSubmit = async (event) => {
    event.preventDefault();
    this.setState({
      firstOption: false,
      secondOption: false,
      thirdOption: false,
      fourthOption: false,
    });

    const formData = new FormData(event.target);
    const loanId = formData.get("loanId");

    const data = {
      amount: parseFloat(formData.get("paymentAmount")),
      transaction_type: formData.get("paymentType"),
    };

    try {
      const response = await fetch(
        `http://localhost:5000/loans/${loanId}/payments`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        this.setState({
          backendResult: { error: result.error || "Payment failed" },
          secondOption: true,
        });
      } else {
        this.setState({ backendResult: result, secondOption: true });
      }
    } catch (error) {
      this.setState({
        backendResult: { error: error.message || "Network error" },
        secondOption: true,
      });
    }
  };

  // Handling API 3: View Loan Details
  handleViewLoanDetailsSubmit = async (event) => {
    event.preventDefault();
    this.setState({
      firstOption: false,
      secondOption: false,
      thirdOption: false,
      fourthOption: false,
    });

    const formData = new FormData(event.target);
    const loanId = formData.get("loanId");

    try {
      const response = await fetch(
        `http://localhost:5000/loans/${loanId}/ledger`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        this.setState({
          backendResult: { error: result.error },
          thirdOption: true,
        });
      } else {
        this.setState({ backendResult: result, thirdOption: true });
      }
    } catch  {
      this.setState({
        backendResult: { error: "Network error" },
        thirdOption: true,
      });
    }
  };

  // Handling API 4: View All Loans
  handleViewAllLoansSubmit = async (event) => {
    event.preventDefault();
    this.setState({
      firstOption: false,
      secondOption: false,
      thirdOption: false,
      fourthOption: false,
    });

    try {
      const response = await fetch(
        "http://localhost:5000/customers/overview",
        {
          headers: this.getAuthHeaders(),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        this.setState({
          backendResult: { error: result.error },
          fourthOption: true,
        });
      } else {
        this.setState({ backendResult: result, fourthOption: true });
      }
    } catch  {
      this.setState({
        backendResult: { error: "Network error" },
        fourthOption: true,
      });
    }
  };

  // Fetch EMI Amount
  fetchEmiAmount = async (loanId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/loans/${loanId}/emi`,
        {
          headers: this.getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (response.ok) {
        this.setState({
          paymentAmount: data.emi_amount,
        });
      }
    } catch (error) {
      console.error("Failed to fetch EMI", error);
      this.setState({
        paymentAmount: "",
      });
    }
  };

  emiChangeOptions = async (event) => {
    const selectedType = event.target.value;
    const { loanNumber } = this.state;

    this.setState({
      emistatus: selectedType,
      paymentAmount: "",
    });

    if (selectedType === "EMI" && loanNumber.trim() !== "") {
      setTimeout(async () => {
        await this.fetchEmiAmount(loanNumber);
      }, 50);
    }
  };

  takingLoanId = async (event) => {
    const loanId = event.target.value;
    const { emistatus } = this.state;

    this.setState({
      loanNumber: loanId,
      paymentAmount: "",
    });

    if (emistatus === "EMI" && loanId.trim() !== "") {
      setTimeout(async () => {
        await this.fetchEmiAmount(loanId);
      }, 50);
    }
  };

  onPaymentAmountChange = (event) => {
    this.setState({
      paymentAmount: event.target.value,
    });
  };

  // FORMS
  renderCreateLoanForm = () => (
    <form onSubmit={this.handleCreateLoanSubmit}>
      <div className="label-input-div">
        <label htmlFor="loanAmount">Loan Amount</label>
        <input
          placeholder="100000"
          className="name"
          type="number"
          id="loanAmount"
          name="loanAmount"
          required
        />
      </div>
      <div className="label-input-div">
        <label htmlFor="loanPeriod">Loan Period (years)</label>
        <input
          placeholder="2"
          className="name"
          type="number"
          id="loanPeriod"
          name="loanPeriod"
          required
        />
      </div>
      <button type="submit">Submit</button>
    </form>
  );

  renderLoanPaymentForm = () => {
    const { emistatus, paymentAmount } = this.state;

    return (
      <form onSubmit={this.handleLoanPaymentSubmit}>
        <div className="label-input-div">
          <label htmlFor="loanId">Loan ID</label>
          <input
            onChange={this.takingLoanId}
            placeholder="LNXXXXXXXXXXXXX"
            className="name"
            type="text"
            id="loanId"
            name="loanId"
            required
          />
        </div>

        <div className="label-input-div">
          <label htmlFor="paymentType">Payment Type</label>
          <select
            className="name"
            id="paymentType"
            name="paymentType"
            value={emistatus}
            onChange={this.emiChangeOptions}
          >
            {emiOptionsList.map((option) => (
              <option key={option.optionId} value={option.optionId}>
                {option.displayText}
              </option>
            ))}
          </select>
        </div>

        <div className="label-input-div">
          <label htmlFor="paymentAmount">Payment Amount</label>
          <input
            className="name"
            type="number"
            step="0.01"
            id="paymentAmount"
            name="paymentAmount"
            placeholder={
              emistatus === "LUMP_SUM"
                ? "Enter custom amount"
                : "EMI will be auto-filled"
            }
            value={paymentAmount}
            readOnly={emistatus === "EMI"}
            onChange={this.onPaymentAmountChange}
            required
          />
        </div>

        <button type="submit">Submit</button>
      </form>
    );
  };

  renderViewLoanDetailsForm = () => (
    <form onSubmit={this.handleViewLoanDetailsSubmit}>
      <div className="label-input-div">
        <label htmlFor="loanId">Loan ID</label>
        <input
          placeholder="LNXXXXXXXXXXXXX"
          className="name"
          type="text"
          id="loanId"
          name="loanId"
          required
        />
      </div>
      <button type="submit">View Details</button>
    </form>
  );

  renderAllLoansForCustomerForm = () => (
    <form onSubmit={this.handleViewAllLoansSubmit}>
      <button type="submit">View My Loans</button>
    </form>
  );

  // RESULTS
  renderCreateLoanFormResult = () => {
    const { backendResult } = this.state;

    if (backendResult.error) {
      return (
        <div className="result-card">
          <h3 className="result-title">Error</h3>
          <div className="result-row">
            <span className="label">Error Message</span>
            <span className="value">{backendResult.error}</span>
          </div>
        </div>
      );
    }

    const { loan_id, customer_id, total_amount_payable, monthly_emi } =
      backendResult;

    return (
      <div className="result-card">
        <h3 className="result-title">Result</h3>
        <div className="result-row">
          <span className="label">Loan ID</span>
          <span className="value">{loan_id}</span>
        </div>
        <div className="result-row">
          <span className="label">Customer ID</span>
          <span className="value">{customer_id}</span>
        </div>
        <div className="result-row">
          <span className="label">Total Amount Payable</span>
          <span className="value bold">{total_amount_payable}</span>
        </div>
        <div className="result-row">
          <span className="label">Monthly EMI</span>
          <span className="value bold">{monthly_emi}</span>
        </div>
      </div>
    );
  };

  renderLoanPaymentFormResult = () => {
    const { backendResult } = this.state;

    if (backendResult.error) {
      return (
        <div className="result-card">
          <h3 className="result-title">Error</h3>
          <div className="result-row">
            <span className="label">Error Message</span>
            <span className="value">{backendResult.error}</span>
          </div>
        </div>
      );
    }

    const { transaction_id, loan_id, message, remaining_balance, emis_left } =
      backendResult;

    return (
      <div className="result-card">
        <h3 className="result-title">Result</h3>
        <div className="result-row">
          <span className="label">Transaction ID</span>
          <span className="value">{transaction_id || "N/A"}</span>
        </div>
        <div className="result-row">
          <span className="label">Loan ID</span>
          <span className="value">{loan_id || "N/A"}</span>
        </div>
        <div className="result-row">
          <span className="label">Remaining Balance</span>
          <span className="value bold">
            {remaining_balance !== undefined ? remaining_balance : "N/A"}
          </span>
        </div>
        <div className="result-row">
          <span className="label">EMI'S Left</span>
          <span className="value bold">
            {emis_left !== undefined ? emis_left : "N/A"}
          </span>
        </div>
        <div className="result-row">
          <span className="label">Message</span>
          <span className="value bold">{message || "N/A"}</span>
        </div>
      </div>
    );
  };

  renderViewLoanDetailsFormResult = () => {
    const { backendResult } = this.state;

    if (backendResult.error) {
      return (
        <div className="result-card">
          <h3 className="result-title">Error</h3>
          <div className="result-row">
            <span className="label">Error Message</span>
            <span className="value">{backendResult.error}</span>
          </div>
        </div>
      );
    }

    const {
      loan_id,
      customer_id,
      principal,
      total_amount,
      monthly_emi,
      total_paid,
      balance_amount,
      emis_left,
      transactions,
    } = backendResult;

    return (
      <div className="result-card">
        <h3 className="result-title">Result</h3>

        <div className="result-row">
          <span className="label">Loan ID</span>
          <span className="value">{loan_id}</span>
        </div>

        <div className="result-row">
          <span className="label">Customer ID</span>
          <span className="value">{customer_id}</span>
        </div>

        <div className="result-row">
          <span className="label">Principal</span>
          <span className="value">{principal}</span>
        </div>

        <div className="result-row">
          <span className="label">Total Amount</span>
          <span className="value">{total_amount}</span>
        </div>

        <div className="result-row">
          <span className="label">Monthly EMI</span>
          <span className="value">{monthly_emi}</span>
        </div>

        <div className="result-row">
          <span className="label">Amount Paid</span>
          <span className="value">{total_paid}</span>
        </div>

        <div className="result-row">
          <span className="label">Balance Amount</span>
          <span className="value">{balance_amount}</span>
        </div>

        <div className="result-row">
          <span className="label">EMI'S Left</span>
          <span className="value">{emis_left}</span>
        </div>

        <div className="loan-table-section">
          <h3 className="table-title">Transaction History</h3>
          <table className="loan-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((eachTran) => (
                <tr key={eachTran.transaction_id}>
                  <td>{eachTran.transaction_id}</td>
                  <td>{eachTran.type}</td>
                  <td className="status paid">{eachTran.amount}</td>
                  <td>{eachTran.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  renderAllLoansForCustomerFormResult = () => {
    const { backendResult } = this.state;

    if (backendResult.error) {
      return (
        <div className="result-card">
          <h3 className="result-title">Error</h3>
          <div className="result-row">
            <span className="label">Error Message</span>
            <span className="value">{backendResult.error}</span>
          </div>
        </div>
      );
    }

    const { customer_id, total_loans, loans } = backendResult;

    if (total_loans === 0) {
      return (
        <div className="result-card">
          <h3 className="result-title">No Loans Found</h3>
          <p>You haven't taken any loans yet.</p>
        </div>
      );
    }

    return (
      <div className="loan-overview-container">
        <div className="header">
          <h2 className="title">Loan Overview</h2>
        </div>

        <div className="overview-info">
          <span className="info-left">
            Customer ID : <strong>{customer_id}</strong>
          </span>
          <span className="info-right">
            Total Loans <strong>{total_loans}</strong>
          </span>
        </div>

        {loans.map((eachLoan) => (
          <div className="loan-card purple" key={eachLoan.loan_id}>
            <div className="loan-id">{eachLoan.loan_id}</div>
            <div className="loan-row">
              <span>Principal</span>
              <span>{eachLoan.principal}</span>
            </div>
            <div className="loan-row">
              <span>Total Amount</span>
              <span className="negative">{eachLoan.total_amount}</span>
            </div>
            <div className="loan-row">
              <span>Total Interest</span>
              <span className="negative">{eachLoan.total_interest}</span>
            </div>
            <div className="loan-row">
              <span>EMI Amount</span>
              <span>{eachLoan.emi_amount}</span>
            </div>
            <div className="loan-row">
              <span>Amount Paid</span>
              <span className="positive">{eachLoan.amount_paid}</span>
            </div>
            <div className="loan-row">
              <span>EMIs Left</span>
              <span className="negative">{eachLoan.emis_left}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  render() {
    const {
      activeOptionId,
      firstOption,
      secondOption,
      thirdOption,
      fourthOption,
      userData,
      shouldLogout,
    } = this.state;

    if (shouldLogout) {
      return <Navigate to="/login" />;
    }

    return (
      <div className="container">
        <div className="header-section">
          <h1 className="main">BANK LENDING SYSTEM</h1>
          {userData && (
            <div className="user-info">
              <span>Welcome, {userData.name}</span>
              <span className="customer-id">ID: {userData.customer_id}</span>
              <button className="logout-btn" onClick={this.handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>

        <select
          className="name"
          onChange={this.onChangeOptions}
          value={activeOptionId}
        >
          {optionList.map((option) => (
            <option key={option.optionId} value={option.optionId}>
              {option.displayText}
            </option>
          ))}
        </select>

        {activeOptionId === "create-loan" && this.renderCreateLoanForm()}
        {activeOptionId === "loan-payment" && this.renderLoanPaymentForm()}
        {activeOptionId === "loan-detail" && this.renderViewLoanDetailsForm()}
        {activeOptionId === "view-loans" &&
          this.renderAllLoansForCustomerForm()}

        {firstOption && this.renderCreateLoanFormResult()}
        {secondOption && this.renderLoanPaymentFormResult()}
        {thirdOption && this.renderViewLoanDetailsFormResult()}
        {fourthOption && this.renderAllLoansForCustomerFormResult()}
      </div>
    );
  }
}

export default Home;